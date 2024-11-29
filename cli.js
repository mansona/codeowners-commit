#!/usr/bin/env node

import Codeowners from 'codeowners';
import { program } from 'commander';
import { execa } from 'execa';
import { groupBy, chunk } from 'lodash-es';

program
  .name('codeowners-commit')
  .description(
    'A simple command line utility to batch commit big changes by codeowners and file count',
  )
  .option('--max-files <number>', 'number of files you want to batch', 100);

program.parse();

const MAX_FILES = program.opts().maxFiles;

const { stdout } = await execa`git status --porcelain`;

const repo = new Codeowners();

const files = stdout
  .split('\n')
  .map((line) => line.replace(/^\s*\w+\s+/, ''))
  .map((file) => ({
    file,
    owners: repo.getOwner(file),
  }));

const groupedFiles = groupBy(files, 'owners');

for (let key in groupedFiles) {
  const items = groupedFiles[key];

  const chunks = chunk(items, MAX_FILES);

  for (let chunk of chunks) {
    let paths = chunk.map((item) => item.file);
    await execa`git add ${paths}`;
    await execa`git commit -m ${`files for codeowner ${key ?? 'MISSING'}`}`;
  }
}
