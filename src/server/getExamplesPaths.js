const fs = require('fs');
const path = require('path');

function getExamplesPaths(){
  const clientPath = path.join(process.cwd(), 'src/client');
  const isDirectory = source => fs.lstatSync(source).isDirectory()
  const getDirectories = source =>
    fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)
  const directories = getDirectories(clientPath);
  const directoriesHasIndexHTML = directories.map((directory)=>{
    const indexHtml = path.join(directory, 'index.html');
    if(fs.existsSync(indexHtml)) {
      return {
        dirName:path.basename(directory),
      }
    }
    return null;
  })
  return directoriesHasIndexHTML.filter(directory=>directory!==null);
}

module.exports = getExamplesPaths;