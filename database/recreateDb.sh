. .config

cp ../.env $ORM_DIST
cd $ORM_DIST

#node db-schema-create.js
node main.js createdbschema



