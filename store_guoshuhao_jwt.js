/**
 * @fileoverview Example of HTTP rewrite.
 *
 * @supported Quantumult X (v1.0.5-build173)
 */

// $request, $response, $notify(title, subtitle, message), console.log(message)
// $request.scheme, $request.method, $request.url, $request.path, $request.headers
// $response.statusCode, $response.headers, $response.body
//
// $prefs is for persistent store and the data of $prefs will be cleared when Quantumult X is deleted.
// $prefs.setValueForKey(value, key), $prefs.removeValueForKey(key), $prefs.removeAllValues(). Returns true or false, value and key should be string.
// $prefs.valueForKey(key) returns value.
//
// setTimeout(function() { console.log("abc"); }, 1000);
//
// You can optional change the response headers at the same time by using $done({body: modifiedBody, headers: modifiedHeaders}); only change the response headers is not allowed for script-response-body. The modifiedHeaders can be copied and modified from $response.headers, please do not change the content length, type and encoding field.
// Response status can also be optional changed by using $done({body: modifiedBody, headers: modifiedHeaders, status: modifiedStatus}), the modifiedStatus should be like "HTTP/1.1 200 OK"

const DOC_ID = "0ecc3a0a675a98a40288c54e0b0dcc45";
const ENV = "production-12-12-5fqyhq72a5d942d";
function encrypt(data) {
  return btoa(btoa(data));
}
function decrypt(data) {
  return atob(atob(data));
}
function getParams() {
  const tmp = $environment.sourcePath.split("?")[1];
  const encryptData = tmp.split("=")[1];
  const params = decrypt(encryptData);
  return JSON.parse(params);
}

function jsonToQueryString(json) {
  return (
    "?" +
    Object.keys(json)
      .map(function (key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
      })
      .join("&")
  );
}

function getCloudAccessToken(appid, secret) {
  const url = "https://api.weixin.qq.com/cgi-bin/token";
  const opts = {
    grant_type: "client_credential",
    appid: appid,
    secret: secret,
  };
  return $task
    .fetch({
      url: url + jsonToQueryString(opts),
      method: "GET",
    })
    .then((response) => {
      console.log(response.body);
      return JSON.parse(response.body);
    });
}

function updateCloudDB(token, jwt) {
  if (jwt == null) {
    throw "jwt is empty";
  }
  const url = "https://api.weixin.qq.com/tcb/databaseupdate";
  const query = `db.collection("jwt").doc("${DOC_ID}").update({data: {
    jwt: "${jwt}"
  }})`;
  const opts = {
    access_token: token,
  };
  return $task
    .fetch({
      url: url + jsonToQueryString(opts),
      method: "POST",
      body: JSON.stringify({
        env: ENV,
        query: query,
      }),
    })
    .then((response) => {
      console.log(response.body);
      return JSON.parse(response.body);
    });
}
function getAllPropertiesAndMethods(obj) {
  let result = [];

  while (obj) {
    const properties = Object.getOwnPropertyNames(obj);
    for (const property of properties) {
      if (!result.includes(property)) {
        result.push(property);
      }
    }
    obj = Object.getPrototypeOf(obj);
  }
  console.log(JSON.stringify(result));
  return result;
}

var body = $response.body;
var obj = JSON.parse(body);

console.log(getAllPropertiesAndMethods($environment));
console.log(JSON.stringify($environment));
console.log(getAllPropertiesAndMethods($task));
console.log(getAllPropertiesAndMethods($configuration));

$prefs.setValueForKey("guoshuhao-jwt-resp", body);

body = JSON.stringify(obj);

console.log(body);

const params = getParams();
console.log(JSON.stringify(params));
getCloudAccessToken(params.appid, params.secret)
  .then((resp) => {
    return resp.access_token;
  })
  .then((token) => {
    return updateCloudDB(token, obj.result.token.access_token);
  })
  .then((resp) => {
    console.log(resp);
    $done(body);
  })
  .catch((e) => {
    console.error(e);
    $done(body);
  });
