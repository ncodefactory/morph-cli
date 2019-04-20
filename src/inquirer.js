import inquirer from 'inquirer';

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line no-useless-escape
  return re.test(String(email).toLowerCase());
};

const validateConatiner = (container) => {
  const re = /^[a-zA-Z][a-zA-Z0-9._-]*[a-zA-Z0-9]$/;
  return re.test(String(container).toLowerCase());
};

const askAuthor = () => {
  const questions = [
    {
      type: 'input',
      name: 'authorName',
      message: 'Author name:',
      validate(value) {
        if (value.length) {
          return true;
        }

        return 'Please enter a name of the author of application.';
      },
    },
    {
      type: 'input',
      name: 'authorEmail',
      message: 'Author e-mail:',
      validate(value) {
        if (value.length && validateEmail(value)) {
          return true;
        }

        return 'Please enter a valid e-mail of the author of application.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askAppName = (name) => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Package name:',
      default: `${name}`,
      validate(value) {
        if (value.length) {
          return true;
        }

        return 'Please enter a name of created package.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askAppBinary = () => {
  const questions = [
    {
      type: 'input',
      name: 'binName',
      message: 'Bin:',
      validate(value) {
        if (value.length) {
          return true;
        }

        return 'Please enter a name of shell command for run this cli.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askComponentDetails = () => {
  const questions = [
    {
      type: 'input',
      name: 'componentName',
      message: 'Component name:',
      validate(value) {
        if (value.length) {
          return true;
        }

        return 'Please enter a name of created component.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askAppDescription = (name, type) => {
  const questions = [
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: `${name} - an ${type} created using morph-cli`,
      validate(value) {
        if (value.length) {
          return true;
        }
        return 'Please enter a short description of application.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askRepoDetails = (name) => {
  const questions = [
    {
      type: 'input',
      name: 'repoUrl',
      message: 'Repo url:',
      default: name,
      validate(value) {
        if (value.length) {
          return true;
        }
        return 'Please enter url of git repository for application.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

const askContainerDetails = (name) => {
  if (validateConatiner(name)) {
    return name.toLowerCase();
  }

  const questions = [
    {
      type: 'input',
      name: 'containerName',
      message: 'Docker container name',
      validate(value) {
        if (value.length && validateConatiner(value)) {
          return true;
        }

        return 'Please enter a valid docker container name for application. Allowed [a-zA-Z0-9][a-zA-Z0-9_.-] only.';
      },
    },
  ];
  return inquirer.prompt(questions);
};

export {
  askAuthor,
  askAppName,
  askAppBinary,
  askAppDescription,
  askRepoDetails,
  askComponentDetails,
  askContainerDetails,
};
