import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { TEST_ADMIN_CREDENTIALS } from './data/creadentials';
import { TEST_COMPANY } from './data/data';
import { Company } from '@nestjs-orm/client';
import { CompanyTestHelper } from './utils/CompanyTestHelper';

let testCompany1: Company = undefined;
let testCompany2: Company = undefined;
let testCompany3: Company = undefined;
const testCompany1Name = TEST_COMPANY.name + '1';
const testCompany2Name = TEST_COMPANY.name + '2';
const testCompany3Name = TEST_COMPANY.name + '3';
let jwtForAdmin: string;
const BULK_CREATE = 200;
const BULK_DELETE = 100;

/**
 * To delete test data from database and cache
 */
const deleteTestData = async () => {
  return CompanyTestHelper.deleteAllCompanies(jwtForAdmin);
};

/**
 * To create 3 companies and load into:
 *  - testCompany1
 *  - testCompany2
 *  - testCompany3
 */
const createTestData = async () => {
  await CompanyTestHelper.createCompany({ ...TEST_COMPANY, name: testCompany1Name }, jwtForAdmin);
  testCompany1 = CompanyTestHelper.lastCompany;

  await CompanyTestHelper.createCompany({ ...TEST_COMPANY, name: testCompany2Name, location: 'Brüsszel' }, jwtForAdmin);
  testCompany2 = CompanyTestHelper.lastCompany;

  await CompanyTestHelper.createCompany({ ...TEST_COMPANY, name: testCompany3Name, location: 'Kerecsend', active: false }, jwtForAdmin);
  testCompany3 = CompanyTestHelper.lastCompany;
};

/**
 * To invalidate the test data cache (for sure)
 */
const invalidateTestDataCache = async () => {
  await CompanyTestHelper.invalidateCompanyCache(jwtForAdmin);
};

describe('OrmCrudForCurrentUserController', () => {
  /**
   * beforeAll:
   *    - delete all companies
   * afterAll:
   *    - delete all companies
   *
   * Tests:
   *  [1] create companies
   *  [2] check companies in cache
   *  [3] invalidate cache
   *  [4] cleanup + re-create companies
   *  [5] delete company directly from DB and check cache
   *  [6] cleanup + re-create companies again
   *  [7] update companies
   *  [8] delete company
   *  [9] delete all companies
   *  [10] bulk create companies (#{link BULK_CREATE}), bulk delete (#{link BULK_DELETE})
   */
  beforeAll(async () => {
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    await deleteTestData();
  });

  afterAll(async () => {
    await deleteTestData();
  });

  it('[0] CACHE TEST SHOULD BE REWRITTEN', async () => {
    throw new Error('CACHE TEST SHOULD BE REWRITTEN');
  });

  it('[1] create companies', async () => {
    await createTestData();
  });

  it('[2] check companies in cache', async () => {
    const values: Company[] = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(values.length).toEqual(3);

    const valuesFromCache: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache.length).toEqual(3);
  });

  it('[3] invalidate cache', async () => {
    // invalidate
    await invalidateTestDataCache();

    // check empty cache
    const valuesFromCache: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache.length).toEqual(0);

    // reload cache from DB
    const values: Company[] = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(values.length).toEqual(3);

    // check cache again
    const valuesFromCache2 = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(valuesFromCache2.length).toEqual(3);
  });

  it('[4] cleanup + re-create companies', async () => {
    await invalidateTestDataCache();
    await deleteTestData();
    await createTestData();
  });

  it('[5] delete company directly from DB and check cache', async () => {
    // first read companies
    const valuesFromCache: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache.length).toEqual(3);
    testCompany1 = valuesFromCache[0];
    testCompany2 = valuesFromCache[1];
    testCompany3 = valuesFromCache[2];

    // delete 1st company directly from DB (cache not affected)
    await CompanyTestHelper.deleteCompanyDirect(testCompany1.id, jwtForAdmin);

    // cache still contains all
    const valuesFromCache2: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache2.length).toEqual(3);

    // invalidate
    await invalidateTestDataCache();

    // check empty cache
    const valuesFromCache3: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache3.length).toEqual(0);

    // get all companies again, 1 deleted before
    // so, 2 expected
    const values: Company[] = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(values.length).toEqual(2);

    const valuesFromCache5: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache5.length).toEqual(2);

    // check cached values
    // 1s value should be missing
    const testValues1: Company[] = valuesFromCache5.filter((c) => c.id === testCompany1.id);
    expect(testValues1.length).toEqual(0);
    // 2nd value
    const testValues2: Company[] = valuesFromCache5.filter((c) => c.id === testCompany2.id);
    expect(testValues2.length).toEqual(1);
    // 3rd value
    const testValues3: Company[] = valuesFromCache5.filter((c) => c.id === testCompany3.id);
    expect(testValues3.length).toEqual(1);
  });

  it('[6] cleanup + re-create companies again', async () => {
    await invalidateTestDataCache();
    await deleteTestData();
    await createTestData();
  });

  it('[7] update company 2', async () => {
    const newName = testCompany2.name + ' & Friends';
    const newLocation = 'Csokonyavisonta';
    const backupCompany2ForCompare: Company = { ...testCompany2 };
    const updatedCompany2: Company = { ...testCompany2, name: newName, location: newLocation };
    await CompanyTestHelper.updateCompany(updatedCompany2, jwtForAdmin);

    const values: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(values.length).toEqual(3);

    const found = values.find((c) => c.id === backupCompany2ForCompare.id);
    expect(found).toBeDefined();
    expect(found.name).toEqual(newName);
    expect(found.location).toEqual(newLocation);
  });

  it('[8] delete company 2', async () => {
    // delete company 2
    await CompanyTestHelper.deleteCompany(testCompany2.id, jwtForAdmin);

    // check remainings - should be 2 items
    const remaining = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    const remainingInCache = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(remaining.length).toEqual(2);
    expect(remainingInCache.length).toEqual(2);

    // check content of company 2
    const found1 = remaining.find((c) => c.id === testCompany1.id);
    expect(found1).toBeDefined();
    expect(found1.name).toEqual(testCompany1.name);

    const found1InCache = remaining.find((c) => c.id === testCompany1.id);
    expect(found1InCache).toBeDefined();
    expect(found1InCache.name).toEqual(testCompany1.name);

    // check content of company 3
    const found3 = remaining.find((c) => c.id === testCompany3.id);
    expect(found3).toBeDefined();
    expect(found3.name).toEqual(testCompany3.name);

    const found3InCache = remaining.find((c) => c.id === testCompany3.id);
    expect(found3InCache).toBeDefined();
    expect(found3InCache.name).toEqual(testCompany3.name);
  });

  it('[9] delete all companies', async () => {
    await CompanyTestHelper.deleteAllCompanies(jwtForAdmin);
    const remainingInCache = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(remainingInCache.length).toEqual(0);
  });

  it(`[10] bulk create companies (${BULK_CREATE}), bulk delete (${BULK_DELETE})`, async () => {
    for (let n = 0; n < BULK_CREATE; n++) {
      await CompanyTestHelper.createCompany({ ...TEST_COMPANY, name: testCompany1Name + '-' + n }, jwtForAdmin);
    }
    const values: Company[] = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(values.length).toEqual(BULK_CREATE);
    const valuesFromCache: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache.length).toEqual(BULK_CREATE);

    for (let n = 0; n < BULK_DELETE; n++) {
      await CompanyTestHelper.deleteCompany(values[n].id, jwtForAdmin);
    }
    const values2: Company[] = await CompanyTestHelper.getAllCompanies(jwtForAdmin);
    expect(values2.length).toEqual(BULK_CREATE - BULK_DELETE);
    const valuesFromCache2: Company[] = await CompanyTestHelper.getAllCachedCompanies(jwtForAdmin);
    expect(valuesFromCache2.length).toEqual(BULK_CREATE - BULK_DELETE);
  });

  console.log(new CompanyTestHelper());
});
