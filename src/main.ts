const core    = require('@actions/core');
const github  = require('@actions/github');
const exec    = require('@actions/exec');
const io      = require('@actions/io');
const cp      = require('child_process');
const fs      = require('fs');
const path    = require('path');

async function run() {
  try {

    // Get github context data
    const context = github.context;

    // get inputs from workflow
    const inputs = {
      additional_definitions: core.getInput('additional_definitions'),
      additional_packages:    core.getInput('additional_packages'),
      github_token:           core.getInput('github_token'),
      make_version:           core.getInput('make_version'),
      make_release:           core.getInput('make_release'),
      make_path:              core.getInput('make_path')
    };
    
    // intialize variables
    const owner     = context.repo.owner
    const repo      = context.repo.repo
    const ref       = context.ref
    const cwd       = process.cwd();
    const basename  = path.basename(inputs.make_path);

    const makeFile            = {
      srcFullPath: `${cwd}/${inputs.make_path}`,
      destFullPath: `${cwd}/RPMS`,
    };

    const version     = (inputs.github_token) ? 'VERSION='+inputs.make_version : "";
    const release     = (inputs.github_token) ? 'RELEASE='+inputs.make_release : "";
    const githubToken = (inputs.github_token) ? 'GITHUB_TOKEN='+inputs.github_token : "";

    // Installs additional packages
    // user input, eg: '["centos-release-scl"]'

    if (inputs.additional_packages) {
      const arr = JSON.parse(inputs.additional_packages);
      for (let i = 0; i < arr.length; i++) {
        console.log(`Installing repo': ${arr[i]}`);
          await exec.exec(`yum install -y ${arr[i]}`);
      };
    }

    process.chdir(makeFile.srcFullPath);

    try {
      await exec.exec(
        `make build ${version} ${release} ${githubToken} ${inputs.additional_definitions}`
      );
    } catch (err) {
      core.setFailed(`action failed with error: ${err}`);
    }

    if(!fs.existsSync(makeFile.destFullPath)) {
      fs.mkdirSync(makeFile.destFullPath);
    }

    const buildDir = fs.readdirSync(makeFile.destFullPath);
    buildDir.forEach(rpm => {
      if(path.extname(rpm) == ".rpm")
        fs.renameSync(rpm, makeFile.destFullPath)
    })

    process.chdir(cwd);

    core.setOutput("rpm_dir_path", makeFile.destFullPath);          // path to RPMS directory
    core.setOutput("rpm_content_type", "application/octet-stream"); // Content-type for Upload

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();