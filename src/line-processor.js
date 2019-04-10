const lineProcessor = dictionary => (line) => {
  let result = line;
  dictionary.forEach((element) => {
    result = result.replace(element.key, element.value);
  });

  return result;
};

export default lineProcessor;
