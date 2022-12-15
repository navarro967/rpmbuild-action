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

    // To be used to get contents of this git ref 
    const owner = context.repo.owner
    const repo = context.repo.repo
    const ref = context.ref

    // get inputs from workflow
    let additionalDefs  = "";
    let githubToken = "";
    const configPath = core.getInput('spec_file'); // user input, eg: `foo.spec' or `rpm/foo.spec'
    const basename = path.basename(configPath); // always just `foo.spec`
    const specFile = {
      srcFullPath: `/github/workspace/${configPath}`,
      destFullPath: `/github/home/rpmbuild/SPECS/${basename}`,
    };

    console.log(`${await exec.exec("ls -alh /github/workspace/")}`);

    let name = '';       
    let version = '';

    // Installs additional repositories
    const additionalRepos = core.getInput('additional_repos'); // user input, eg: '["centos-release-scl"]'

    if(core.getInput('additional_definitions')) 
      additionalDefs = core.getInput('additional_definitions');

    if(core.getInput('github_token')) 
      githubToken = `GITHUB_TOKEN=${core.getInput('github_token')}`;

    if (additionalRepos) {
      const arr = JSON.parse(additionalRepos);
      for (let i = 0; i < arr.length; i++) {
        console.log(`Installing repo': ${arr[i]}`);
          await exec.exec(`yum install -y ${arr[i]}`);
      };
    }

    try {
      await exec.exec(
        `cd ${specFile.destFullPath}; make build ${githubToken}`
      );
    } catch (err) {
      core.setFailed(`action failed with error: ${err}`);
    }

    let myOutput = '';
    await cp.exec('ls /github/home/rpmbuild/SRPMS/', (err, stdout, stderr) => {
      if (err) {
        //some err occurred
        console.error(err)
      } else {
          // the *entire* stdout and stderr (buffered)
          console.log(`stdout: ${stdout}`);
          myOutput = myOutput+`${stdout}`.trim();
          console.log(`stderr: ${stderr}`);
        }
      });


    // only contents of workspace can be changed by actions and used by subsequent actions 
    // So copy all generated rpms into workspace , and publish output path relative to workspace (/github/workspace)
    await exec.exec(`mkdir -p rpmbuild/RPMS`);

    //await cp.exec(`cp -R /github/home/rpmbuild/RPMS/. rpmbuild/RPMS/`)

    await exec.exec(`ls -la rpmbuild/RPMS`);
    
    // set outputs to path relative to workspace ex ./rpmbuild/
    core.setOutput("rpm_dir_path", `rpmbuild/RPMS/`);                      // path to RPMS directory
    core.setOutput("rpm_content_type", "application/octet-stream");        // Content-type for Upload
    


  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
