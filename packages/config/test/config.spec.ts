import path from 'path';
import _ from 'lodash';

import {
  Config,
  DEFAULT_REGISTRY,
  DEFAULT_UPLINK,
  defaultSecurity,
  parseConfigFile,
  ROLES,
  WEB_TITLE,
} from '../src';
import { parseConfigurationFile } from './utils';

const resolveConf = (conf) => {
  const { name, ext } = path.parse(conf);

  return path.join(__dirname, `../src/conf/${name}${ext.startsWith('.') ? ext : '.yaml'}`);
};

const checkDefaultUplink = (config) => {
  expect(_.isObject(config.uplinks[DEFAULT_UPLINK])).toBeTruthy();
  expect(config.uplinks[DEFAULT_UPLINK].url).toMatch(DEFAULT_REGISTRY);
};

const checkDefaultConfPackages = (config) => {
  // auth
  expect(_.isObject(config.auth)).toBeTruthy();
  expect(_.isObject(config.auth.htpasswd)).toBeTruthy();
  expect(config.auth.htpasswd.file).toMatch(/htpasswd/);

  // web
  expect(_.isObject(config.web)).toBeTruthy();
  expect(config.web.title).toBe(WEB_TITLE);
  expect(config.web.enable).toBeUndefined();

  // packages
  expect(_.isObject(config.packages)).toBeTruthy();
  expect(Object.keys(config.packages).join('|')).toBe('@*/*|**');
  expect(config.packages['@*/*'].access).toBeDefined();
  expect(config.packages['@*/*'].access).toContainEqual(ROLES.$ALL);
  expect(config.packages['@*/*'].publish).toBeDefined();
  expect(config.packages['@*/*'].publish).toContainEqual(ROLES.$AUTH);
  expect(config.packages['@*/*'].proxy).toBeDefined();
  expect(config.packages['@*/*'].proxy).toContainEqual(DEFAULT_UPLINK);
  expect(config.packages['**'].access).toBeDefined();
  expect(config.packages['**'].access).toContainEqual(ROLES.$ALL);
  expect(config.packages['**'].publish).toBeDefined();
  expect(config.packages['**'].publish).toContainEqual(ROLES.$AUTH);
  expect(config.packages['**'].proxy).toBeDefined();
  expect(config.packages['**'].proxy).toContainEqual(DEFAULT_UPLINK);
  // uplinks
  expect(config.uplinks[DEFAULT_UPLINK]).toBeDefined();
  expect(config.uplinks[DEFAULT_UPLINK].url).toEqual(DEFAULT_REGISTRY);
  // audit
  expect(config.middlewares).toBeDefined();
  expect(config.middlewares.audit).toBeDefined();
  expect(config.middlewares.audit.enabled).toBeTruthy();
  // logs
  expect(config.logs).toBeDefined();
  expect(config.logs.type).toEqual('stdout');
  expect(config.logs.format).toEqual('pretty');
  expect(config.logs.level).toEqual('http');
  // must not be enabled by default
  expect(config.notify).toBeUndefined();
  expect(config.store).toBeUndefined();
  expect(config.publish).toBeUndefined();
  expect(config.url_prefix).toBeUndefined();
  expect(config.url_prefix).toBeUndefined();

  expect(config.experiments).toBeUndefined();
  expect(config.security).toEqual(defaultSecurity);
};

describe('check basic content parsed file', () => {
  test('parse default.yaml', () => {
    const config = new Config(parseConfigFile(resolveConf('default')));
    checkDefaultUplink(config);
    expect(config.storage).toBe('./storage');
    expect(config.auth.htpasswd.file).toBe('./htpasswd');
    checkDefaultConfPackages(config);
  });

  test('should set storage to value set in VERDACCIO_STORAGE_PATH environment variable', () => {
    const storageLocation = '/tmp/verdaccio';
    process.env.VERDACCIO_STORAGE_PATH = storageLocation;
    const config = new Config(parseConfigFile(resolveConf('default')));
    expect(config.storage).toBe(storageLocation);
    delete process.env.VERDACCIO_STORAGE_PATH;
  });

  test('should set storage path to VERDACCIO_STORAGE_PATH if both config and env are set', () => {
    const storageLocation = '/tmp/verdaccio';
    process.env.VERDACCIO_STORAGE_PATH = storageLocation;
    const config = new Config(parseConfigFile(parseConfigurationFile('storage')));
    expect(config.storage).toBe(storageLocation);
    delete process.env.VERDACCIO_STORAGE_PATH;
  });

  test('should take storage from environment variable if not exists in configs', () => {
    const storageLocation = '/tmp/verdaccio';
    process.env.VERDACCIO_STORAGE_PATH = storageLocation;
    const defaultConfig = parseConfigFile(resolveConf('default'));
    delete defaultConfig.storage;
    const config = new Config(defaultConfig);
    expect(config.storage).toBe(storageLocation);
    delete process.env.VERDACCIO_STORAGE_PATH;
  });

  test('parse docker.yaml', () => {
    const config = new Config(parseConfigFile(resolveConf('docker')));
    checkDefaultUplink(config);
    expect(config.storage).toBe('/verdaccio/storage/data');
    expect(config.auth.htpasswd.file).toBe('/verdaccio/storage/htpasswd');
    checkDefaultConfPackages(config);
  });
});
