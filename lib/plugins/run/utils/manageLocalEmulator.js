'use strict';

const BbPromise = require('bluebird');
const childProcess = BbPromise.promisifyAll(require('child_process'));

const getLocalRootUrl = require('./getLocalRootUrl');
const deployFunctionsToLocalEmulator = require('./deployFunctionsToLocalEmulator');
const logServerless = require('./logServerless');
const logLocalEmulator = require('./logLocalEmulator');

function manageLocalEmulator(service, servicePath, options) {
  let initialized = false;
  const { port, debug } = options;
  let params = ['--port', port];
  if (debug) {
    params = params.concat(['--debug']);
    logServerless('Spinning Up the Local Emulator in debug mode');
  } else {
    logServerless('Spinning Up the Local Emulator');
  }
  const cp = childProcess.spawn('sle', params);

  cp.stdout.on('data', stdout => {
    logLocalEmulator(stdout.toString('utf8'));
    if (!initialized) {
      initialized = true;
      return deployFunctionsToLocalEmulator(service, servicePath,
        getLocalRootUrl(port));
    }
    return BbPromise.resolve();
  });

  cp.stderr.on('data', stderr => {
    logLocalEmulator(stderr.toString('utf8'));
  });

  cp.on('close', () => BbPromise.resolve());
  cp.on('error', error => BbPromise.reject(error));

  process.on('exit', () => cp.kill());
}

module.exports = manageLocalEmulator;