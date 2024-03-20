export class StringUtils {
  /**
   * To get number of characters in a string.
   * It provides the charater length even if string contains UTF-16.
   *
   *  NOTE:
   *    String.length returns NOT the number of charaters from UTF-16
   *    string, but number of bytes.
   *
   * @param str
   */
  static getCharacterLength(str: string) {
    // The string iterator that is used here iterates over characters,
    // not mere code units
    return [...str].length;
  }
}
