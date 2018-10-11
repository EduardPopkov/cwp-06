const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, resp) => {
  parseBodyJson(req, (err, data) => {
    resp.statusCode = 200;
    resp.setHeader('Content-Type', 'application/json');

    switchMethod(resp, req.url, data);

    resp.end();
  });
});

function switchMethod(resp, url, data) {
  let readJSON = fs.readFileSync('./articles.json');
  let jsonFile = JSON.parse(readJSON);
  let date = new Date();

  switch (url) {
    case '/readall':
      fs.appendFileSync('./log.txt', 'readall --- ' + date + '\n');
      readAll(resp, data, jsonFile);
    break;

    case '/read':
      fs.appendFileSync('./log.txt', 'read --- ' + date + '\n');
      read(resp, data, jsonFile);
    break;

    case '/create':
      fs.appendFileSync('./log.txt', 'create --- ' + date + '\n');
      create(resp, data, jsonFile);
    break;

    case '/update':
      fs.appendFileSync('./log.txt', 'update --- ' + date + '\n');
      update(resp, data, jsonFile);
    break;

    case "/delete":
    fs.appendFileSync('./log.txt', 'delete --- ' + date + '\n');
      delet(resp, data, jsonFile);
    break;

    case "/createComment":
    fs.appendFileSync('./log.txt', 'createComment --- ' + date + '\n');
      createComment(resp, data, jsonFile);
    break;

    case "/deleteComment":
    fs.appendFileSync('./log.txt', 'deleteComment --- ' + date + '\n');
      deleteComment(resp, data, jsonFile);
    break;

    case "/logs":
      var logFile = fs.readFileSync('./log.txt', 'utf8');
      resp.write(JSON.stringify(logFile))
    break;

    default:
      let result = { code: 404, message: 'Not found'};
      resp.write(JSON.stringify(result));
      break;
  }
}
//---------------------------------------------------------
function readAll(resp, data, jsonFile) {
  const sortType = data.sortOrder || 'asc';
  const sortField = data.sortField || 'id';
  const page = data.page;
  const limit = data.limit;
  const includeDeps = data.includeDeps || false;

  if(includeDeps){
    for(let i = 0; i < jsonFile.Articles.length; i++){
      jsonFile.Articles[i].comments = 'hidden';
    }
  }

  switch (sortField) {
    case 'id':
      jsonFile.Articles.sort(comparebyId);
      if(sortType == 'desc') jsonFile.Articles.reverse();
      break;
    case 'author':
      jsonFile.Articles.sort(comparebyAuthor);
      if(sortType == 'desc') jsonFile.Articles.reverse();
      break;
    default:
      break;
  }

  let messages = [];
  let message = {};
  let arr;
  let j = 0;

  if(page != undefined){
    for(let i = 0; i < jsonFile.Articles.length; i++){
      if(page == jsonFile.Articles[i].page){
        arr = Array.from(jsonFile.Articles[i].comments);

        while (j < limit) {
          message.id = arr[j].id;
          message.date = arr[j].date;
          message.author = arr[j].author;
          messages.push(message);
          j++;
        }

        jsonFile.Articles[i].comments = messages;

        resp.write(JSON.stringify(jsonFile.Articles[i]));
        break;
      }
    }
  } else{
    resp.write(JSON.stringify(jsonFile.Articles));
  }
}
//---------------------------------------------------------
function read(resp, data, jsonFile) {
  let id = data.id;
  let str;

  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(id == jsonFile.Articles[i].id){
      resp.write(JSON.stringify(jsonFile.Articles[i]));
      break;
    }
  }
}
//---------------------------------------------------------
function create(resp, data, jsonFile) {
  let flag = false;
  let str2;

  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(data.id == jsonFile.Articles[i].id){
      flag = true;
      resp.write(JSON.stringify('Error'));
    }
  }

  if(!flag){
    jsonFile.Articles.push({id: data.id,
                            title: data.title,
                            text: data.text,
                            date: data.date,
                            author: data.author,
                            page: data.page,
                            comments: data.comments});

    fs.writeFileSync('./articles2.json', JSON.stringify(jsonFile));

    for(let i = 0; i < jsonFile.Articles.length; i++){
      if(data.id == jsonFile.Articles[i].id){
        resp.write(JSON.stringify(jsonFile.Articles[i]));
        break;
      }
    }
  }
}
//---------------------------------------------------------
function update(resp, data, jsonFile) {
  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(data.id == jsonFile.Articles[i].id){
      jsonFile.Articles[i].date = data.date;
    }
  }

  fs.truncate('./articles2.json', 0, function() {
      fs.writeFileSync('./articles2.json', JSON.stringify(jsonFile));
  });
}
//---------------------------------------------------------
function delet(resp, data, jsonFile) {

  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(data.id == jsonFile.Articles[i].id){
      jsonFile.Articles[i] = null;

      fs.truncate('./articles2.json', 0, function() {
          fs.writeFileSync('./articles2.json', JSON.stringify(jsonFile));
      });
      break;
    }
  }
}
//---------------------------------------------------------
function createComment(resp, data, jsonFile) {
  comments = {};
  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(data.articleId == jsonFile.Articles[i].id){
      for(let j = 0; j < jsonFile.Articles[i].comments.length; j++){
        if(data.id != jsonFile.Articles[i].comments[j].id){
          comments.id = data.id;
          comments.articleId = data.articleId;
          comments.text = data.text;
          comments.date = data.date;
          comments.author = data.author;
          jsonFile.Articles[i].comments.push(comments);

          fs.writeFileSync('./articles2.json', JSON.stringify(jsonFile));
          break;
        }
      }
      break;
    }
  }
}
//---------------------------------------------------------
function deleteComment(resp, data, jsonFile) {
  for(let i = 0; i < jsonFile.Articles.length; i++){
    if(data.articleId == jsonFile.Articles[i].id){
      for(let j = 0; j < jsonFile.Articles[i].comments.length; j++){
        if(data.id == jsonFile.Articles[i].comments[j].id){
          jsonFile.Articles[i].comments[j] = null;
          fs.writeFileSync('./articles2.json', JSON.stringify(jsonFile));
          break;
        }
      }
      break;
    }
  }
}
//---------------------------------------------------------
function comparebyId(obj1, obj2){
  return obj1.id - obj2.id;
}
function comparebyAuthor(obj1, obj2){
  return obj1.author - obj2.author;
}
//---------------------------------------------------------

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});

function parseBodyJson(req, cb) {
  let body = [];

  req.on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();

    let params = JSON.parse(body);

    cb(null, params);
  });
}
