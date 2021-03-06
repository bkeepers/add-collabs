const defaultsShape = {
  existingCollaboratorMessage: 'string',
  newCollaboratorMessage: 'string',
};

function checkForDefaults(defaults) {
  const errors = Object.keys(defaultsShape).filter(key => !Object.prototype.hasOwnProperty.call(defaults, key));
  if (errors.length > 0) errors.forEach(err => console.error(`Key \`${err}\` of type \`${defaultsShape[err]}\` is missing.`));
}

/**
  * @typedef {Object} Config
  * @prop {string} existingCollaboratorMessage
  * @prop {string} newCollaboratorMessage
  *
  * Anytime a user opens an issue, add them as a collaborator to the repository.
  * @param {Object} robot
  * @param {Config} defaults
  * @param {string} [configFilename]
  */
module.exports = (robot, defaults, configFilename = 'add-collabs.yml') => {
  checkForDefaults(defaults);

  robot.on('issues.opened', async context => {
    const {issue, action} = context.payload;
    const issueOwner = issue.user.login;

    const repo = context.repo({username: issueOwner});

    let config;
    try {
      const {addCollaborators} = await context.config(configFilename);
      config = Object.assign({}, defaults, addCollaborators);
    } catch (err) {
      config = defaults;
    }

    const isCollab = await context.github.repos.checkCollaborator(repo)
      .catch(() => {
        context.github.repos.addCollaborator(repo);
      });

    const params = {
      number: issue.number,
      body: isCollab ? config.existingCollaboratorMessage : config.newCollaboratorMessage,
    };
    // / When testing, uncomment the line below and comment the return line -- this avoids the bot getting marked as spam.
    // robot.log("This is the params", params);
    return context.github.issues.createComment(context.repo(params));
  });

  console.log('Yay, the teacher-bot/add-collabs plugin was loaded!');

  // For more information on building plugins:
  // https://github.com/probot/probot/blob/master/docs/plugins.md

  // To get your plugin running against GitHub, see:
  // https://github.com/probot/probot/blob/master/docs/development.md

};
