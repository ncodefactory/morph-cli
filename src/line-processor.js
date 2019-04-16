const replaceAll = (str, find, replace) => {
  let result = str;
  while (result.includes(find)) {
    result = result.replace(find, replace);
  }

  return result;
};

const lineProcessor = replaceDictionary => (line) => {
  let result = line;
  replaceDictionary.forEach((element) => {
    result = replaceAll(result, element.key, element.value);
  });

  return result;
};

export default lineProcessor;
