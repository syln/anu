/*!
快应用不支持 类属性， 只好将它抽出来放到类名后面
并且针对app要做一些转换

*/
const path = require('path');
const utils = require('../utils');
const platConfig = require('../config');

//默认manifest.json
var manifest = {
    package: 'org.hapjs.demo.sample',
    name: 'nanachi转快应用',
    versionCode: 1,
    minPlatformVersion: 1030,
    icon: '/assets/logo.png',
    features: [
        { name: 'system.webview' },
        { name: 'system.prompt' },
        { name: 'system.clipboard' },
        { name: 'system.calendar' },
        { name: 'system.device' },
        { name: 'system.fetch' },
        { name: 'system.file' },
        { name: 'system.geolocation' },
        { name: 'system.image' },
        { name: 'system.media' },
        { name: 'system.notification' },
        { name: 'system.barcode' },
        { name: 'system.sensor' },
        { name: 'system.share' },
        { name: 'system.shortcut' },
        { name: 'system.storage' },
        { name: 'system.vibrator' },
        { name: 'system.network' },
        { name: 'system.request' },
        { name: 'system.audio' },
        { name: 'system.volume' },
        { name: 'system.battery' },
        { name: 'system.brightness' },
        { name: 'system.package' },
        { name: 'system.record' },
        { name: 'system.sms' },
        { name: 'system.websocketfactory' },
        { name: 'system.wifi' },
        { name: 'service.stats' },
        { name: 'service.account' },
        { name: 'system.contact'},
        { name: 'service.app' },
        { name: 'service.share', 'params': {'appSign': '', 'wxKey': ''} },
        { name: 'service.pay' },
        { name: 'service.alipay' },
        {
            name: 'service.wxpay',
            'params': {
                'url': '',
                'package': '',
                'sign': ''
            }
        },
        {
            name: 'service.push',
            'params': {
                'appId': '',
                'appKey': ''
            }
        },
        {
            name: 'service.wxaccount',
            'params': {
                'appId': '',
                'package': '',
                'sign': ''
            }
        },
        {
            name: 'service.qqaccount',
            'params': {
                'package':'',
                'appId': '',
                'sign': '',
                'clientId':''
            }
        },
        {
            name: 'service.wbaccount',
            'params': {
                'sign': '',
                'appKey': ''
            }
        }
    ],
    permissions: [
        { origin: '*' }
    ],
    config: {
        logLevel: 'debug',
        data: {
            back: false
        }
    },
    router: {
        entry: 'pages/index',
        pages: {
           
        }
    },
    display: {
        menu: true,
        titleBar: true
    },
    subpackages: []
      
};


//配置页面路由
function setRouter(config) {
    config.pages.forEach(function(el ,index){
        //如果是webview, 不注入router配置
        if (utils.isWebView(path.join(process.cwd(), platConfig.sourceDir, el + '.js' ))) {
            return;
        }
        var routePath = el.slice(0, -6);
        manifest.router.pages[routePath] = {
            component: 'index'
        };
        //设置首页
        if (index === 0){
            manifest.router.entry = routePath;
        } 
    });
}

//配置titlebar
function setTitleBar(config) {
    var display = manifest.display;
    var win = config.window || {};
    var disabledTitleBarPages = platConfig[platConfig['buildType']].disabledTitleBarPages || [];
    disabledTitleBarPages.forEach(function(el){
        // userPath/titledemo/source/pages/index/index.js => pages/index/index
        let route = path.relative( path.join(process.cwd(), platConfig.sourceDir),  path.dirname(el) );
        display.pages = display.pages || {};
        display['pages'][route] = display['pages'][route] || {};
        display['pages'][route]['titleBar'] = false;
    });
    
    display.titleBarText = win.navigationBarTitleText || 'nanachi';
    display.titleBarTextColor = win.navigationBarTextStyle || 'black';
    display.backgroundColor = win.navigationBarBackgroundColor || '#000000';
}

//配置name, permissions, config, subpackages, 各支付签名
function setOtherConfig() {
    let userConfig = {};
    try {
        userConfig = require(path.join(process.cwd(), 'quickConfig.json'));
    } catch (err) {
        // eslint-disable-next-line
    }
   
    //配置各支付签名
    let userFeatures = userConfig.features || [];
    let features = manifest.features.map(function(el){
        let userFeat = userFeatures.find(function(userFeat){
            return userFeat.name === el.name;
        });
        return userFeat ? userFeat : el;
    });
    
    manifest.features = features;

    ['name', 'permissions', 'config', 'subpackages'].forEach(function(el){
        manifest[el] = userConfig[el] ? userConfig[el] : manifest[el];
    });
}


module.exports = function quickConfig(config, modules, queue){
    if (modules.componentType !== 'App') return;
    //配置页面路由
    setRouter(config);

    //配置titlebar
    setTitleBar(config);

    //配置name, permissions, config, subpackages, 各支付签名
    setOtherConfig();
    
    queue.push({
        path: path.join(process.cwd(), 'src', 'manifest.json'),
        code: JSON.stringify(manifest, null, 4),
        type: 'json'
    });

    var win = config.window;
    delete config.window;
    delete config.pages;
    Object.assign(config, win);
    return;
};