// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface String {
  format(...replacements: Array<string>): string;
}

if (!String.prototype.format) {
  String.prototype.format = function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    return this.replace(/%s(\d+)/g, (match, number) => {
      return typeof args[number] !== 'undefined' ? args[number] : match;
    });
  };
}
