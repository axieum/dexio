import fs from 'node:fs';
import process from 'node:process';
import chalk from 'chalk';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {log} from '../logging.js';
import {getConfig, loadDefaults, loadEnvironment, loadUserConfig} from './index.js';

vi.mock('node:fs', () => ({default: {
  copyFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
}}));

describe('config', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('loadDefaults', async () => {
    fs.readFileSync.mockReturnValueOnce('{/* comment */"option": "value"}');
    expect(loadDefaults()).toMatchObject({option: 'value'});
  });

  describe('loadUserConfig', () => {
    it('should create a new config file when one does not exist yet', () => {
      fs.existsSync.mockReturnValueOnce(false);
      fs.readFileSync.mockReturnValueOnce('{/* defaults */"lorem": true}');
      const result = loadUserConfig();
      expect(fs.copyFileSync).toBeCalled();
      expect(result).toMatchObject({lorem: true});
    });

    it('should return an empty object when unable to create a new config file', () => {
      fs.existsSync.mockReturnValueOnce(false);
      fs.copyFileSync.mockImplementationOnce(() => {
        throw new Error('expected');
      });
      const result = loadUserConfig();
      expect(fs.copyFileSync).toBeCalled();
      expect(fs.readFileSync).not.toBeCalled();
      expect(result).toMatchObject({});
    });

    it('should parse user configuration', () => {
      fs.readFileSync.mockReturnValueOnce(`{
        /* Discord bot client details. */
        "client": {
          // General Information → Application ID
          "applicationId": "this-is-a-mocked-value"
        }
      }`);
      const result = loadUserConfig();
      expect(fs.readFileSync).toBeCalled();
      expect(result).toMatchObject({client: {applicationId: 'this-is-a-mocked-value'}});
    });

    it('should return an empty object when unable to parse the user configuration', () => {
      fs.readFileSync.mockReturnValueOnce('{"client": {');
      const result = loadUserConfig();
      expect(fs.readFileSync).toBeCalled();
      expect(result).toMatchObject({});
    });
  });

  it('loadEnvironment', () => {
    fs.readFileSync.mockReturnValueOnce('{ "cat": { "lorem": "DEXIO_LOREM", "missing": "DEXIO_MISSING", "flag": "DEXIO_FLAG", "sub": { "pi": "DEXIO_PI" } } }');

    vi.stubEnv('DEXIO_LOREM', 'Lorem ipsum dolor sit amet.');
    vi.stubEnv('DEXIO_FLAG', 'true');
    vi.stubEnv('DEXIO_PI', '3.14');

    const result = loadEnvironment();
    expect(result?.cat).not.toBeNull();
    expect(result.cat.lorem).toBe('Lorem ipsum dolor sit amet.');
    expect(result.cat.flag).toBe('true');
    expect(result.cat).not.toHaveProperty('missing');
    expect(result.cat.sub?.pi).toBe('3.14');
  });

  describe('getConfig', () => {
    it('should load configuration', () => {
      fs.readFileSync
        // Defaults
        .mockReturnValueOnce('{"client": {"token": "mock", "applicationId": null}}')
        // User configuration
        .mockReturnValueOnce('{"client": {"applicationId": "123"}}')
        // Environment variables
        .mockReturnValueOnce('{"client": {"token": "DEXIO_TOKEN", "publicKey": "DEXIO_PUBLIC_KEY"}}');

      vi.stubEnv('DEXIO_PUBLIC_KEY', 'lorem');

      expect(getConfig()).toMatchObject({
        client: {
          token: 'mock',
          applicationId: '123',
          publicKey: 'lorem',
        },
      });
      expect(process.exitCode).toBe(undefined);
    });

    it('should validate configuration', () => {
      const logErrorSpy = vi.spyOn(log, 'error');

      fs.readFileSync
        // Defaults
        .mockReturnValueOnce('{"client": {"token": "mock", "applicationId": null}}')
        // User configuration
        .mockReturnValueOnce('{"client": {"applicationId": ""}}')
        // Environment variables
        .mockReturnValueOnce('{"client": {"token": "DEXIO_TOKEN", "publicKey": "DEXIO_PUBLIC_KEY"}}');

      vi.stubEnv('DEXIO_TOKEN', '');

      expect(getConfig()).toBeNull();
      expect(logErrorSpy).toBeCalledWith(`We found ${chalk.bold.underline('3 issues')} with your configuration:
├ String must contain at least 1 character(s) at "client.token"
├ Required at "client.publicKey"
└ String must contain at least 1 character(s) at "client.applicationId"`);
      expect(process.exitCode).toBe(78);
      process.exitCode = undefined; // Restore
    });
  });
});
