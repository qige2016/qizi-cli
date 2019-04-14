#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const fs = require('fs')
const glob = require('glob') // Match files using the patterns the shell uses, like stars and stuff.
const download = require('../lib/download') // 下载模板
const inquirer = require('inquirer') // 命令行交互
const generator = require('../lib/generator')
const chalk = require('chalk') // command color
const logSymbols = require('log-symbols') // Colored symbols for various log levels
const getGithubConfig = require('../lib/githubConfig')

program.usage('<project-name>')
.option('-r, --repository [repository]', 'assign to repository')
.parse(process.argv)

// 根据输入，获取项目名称
let projectName = program.args[0]

if (!projectName) {
  // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
  program.help()
  return
}

const list = glob.sync('*')  // 遍历当前目录
let rootName = path.basename(process.cwd()) // 根目录

let next = undefined

if (list.length) {
  // 判断当前目录里面是否有输入的projectName目录
  if (list.filter(name => {
    const fileName = path.resolve(process.cwd(), path.join('.', name))
    const isDir = fs.statSync(fileName).isDirectory()
    return name.indexOf(projectName) !== -1 && isDir
  }).length !== 0) {
    console.log(`${projectName} directory is exist`)
    return
  }
  next = Promise.resolve(projectName)

} else if (rootName === projectName) {
  // 输入的projectName和其根目录同名
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: 'The current directory is empty and the directory name is the same as the project name. Do you want to create a new project directly in the current directory?',
      // message: '当前目录为空，目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
      type: 'confirm',
      default: true
    }
  ]).then(answer => {
    return Promise.resolve(answer.buildInCurrent ? projectName : '.')
  })

} else {
  next = Promise.resolve(projectName)
}

next && go()

function go() {
  next.then(projectRoot => {
    if(projectRoot !== '.'){
      fs.mkdirSync(projectRoot)
      const url = program.repository ? program.repository : 'qige2016/vue-admin-template'
      download(url, projectRoot).then(target => {
        return {
          name: projectRoot,
          root: projectRoot,
          downloadTemp: target
        }
      }).then(context => {
        return inquirer.prompt([
          {
            name: 'name',
            message: 'Project name',
            default: context.name
          },
          {
            name: 'description',
            message: 'Project description',
            default: `A Vue.js project`
          },
          {
            name: 'author',
            message: 'Author',
            default: getGithubConfig
          }
        ]).then(answers => {
          return {
            ...context,
            metadata: {
              ...answers
            }
          }
        })
      }).then(context => {
        // 添加生成的逻辑
        return generator(context.metadata, context.downloadTemp, path.parse(context.downloadTemp).dir);
      }).then(res => {
        console.log(logSymbols.success, chalk.green('init success:)\n'))
        console.log('#' + chalk.green(' Project initialization finished!'))
        console.log('# ========================\n')
        console.log('To get started:')
        console.log('   cd ' + res.dest + '\n   npm install\n   npm run dev')
      }).catch(err => {
        console.error(logSymbols.error, chalk.red(`init faild：${err.message}`))
      })
    }
  })

}