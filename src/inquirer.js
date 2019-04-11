import inquirer from 'inquirer';

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line no-useless-escape
  return re.test(String(email).toLowerCase());
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
      message: 'Name:',
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
const askAppDescription = (name) => {
  const questions = [
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: `${name} - an application created using morph-cli`,
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
      default: `${name}.git`,
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

export {
  askAuthor, askAppName, askAppDescription, askRepoDetails,
};
