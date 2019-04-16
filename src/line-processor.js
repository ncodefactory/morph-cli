const replaceAll = (str, find, replace) => {
  let result = str;
  while (result.includes(find)) {
    result = result.replace(find, replace);
  }

  return result;
};

const lineProcessor = dictionary => (line) => {
  let result = line;
  dictionary.forEach((element) => {
    result = replaceAll(result, element.key, element.value);
  });

  return result;
};

export default lineProcessor;
