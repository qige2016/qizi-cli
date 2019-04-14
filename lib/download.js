const download = require('download-git-repo')
const path = require('path')
const ora = require('ora') // show download spinner

module.exports = function (url, target) {
  target = path.join(target || '.', target)
  return new Promise((resolve, reject) => {
    const spinner = ora(`downloading template：https://github.com/${url}`)
    spinner.start()
    // 加direct:解决git clone failed with satus 128
    download('direct:https://github.com/' + url, target, { clone: true }, (err) => {
      if (err) {
        spinner.fail()
        reject(err)
      } else {
        // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
        spinner.succeed()
        resolve(target)
      }
    })
  })
}