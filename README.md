# NY WSC Template


## Mapper application setup

####  Pre-requisites
[node.js](https://nodejs.org/en/download/) installed

####  Install dependencies
run `npm install` to install dependencies

#### Customize application
You can utlize the `/dist` package by editing user confiruation variables in: `/dist/appConfig.js`.  If doing a full build, edit `/src/appConfig.js`.

```JavaScript
var MapX = '-76.2'; //set initial map longitude
var MapY = '42.7'; //set initial map latitude
var MapZoom = 7; //set initial map zoom
```

#### Build app bundle
`npm run build` to run create a production ready bundle set.  This is not used until you are satisfied you have finished edits and are ready to copy to your web server.  Copy the entire contents of `/dist` to your web server

