# photon-projector-screen
Make sure you have [Git](https://git-scm.com/downloads), 
[Node](https://nodejs.org/en/download/), 
[NPM](https://www.npmjs.com/get-npm?utm_source=house&utm_medium=homepage&utm_campaign=free%20orgs&utm_term=Install%20npm), 
and [Bower](https://bower.io/) installed.
```
npm install
```
```
bower install
```
create a particleConfig.json in the root of the app directory (same level as package.json)
```javascript
{
    "particleConfig": {
        "username": "YOURUSERNAME",
    	"password": "YOURPASSWORD",
    	"deviceID": "YOURDEVICEID",
    	"deviceFunction": "YOURFUNCTION"
    }
}
```
```
node app.js
```
