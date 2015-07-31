// Ionic uses AngularUI Router which uses the concept of states
// Learn more here: https://github.com/angular-ui/ui-router
// Set up authRequired for routeSecurity-ui-router: True states which the app can be in.

"use strict";

angular.module('myApp.routes', ['ionic', 'firebase.simpleLogin'])

    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.timeout = 5000;
    }])
    .config(['$translateProvider', function ($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            files: [{
                prefix: 'resources/language/locale-',
                suffix: '.json'
            }]
        });
        $translateProvider.useLoaderCache(true);
        $translateProvider.preferredLanguage('en');
    }])
    .run(function ($ionicPlatform, $translate) {
        $ionicPlatform.ready(function () {
            if (typeof navigator.globalization !== "undefined") {
                navigator.globalization.getPreferredLanguage(function (language) {
                    $translate.use((language.value).split("-")[0]).then(function (data) {
                        console.log("SUCCESS -> " + data);
                    }, function (error) {
                        console.log("ERROR -> " + error);
                    });
                }, null);
            }
        });
    })
    .config(['$urlRouterProvider', function ($urlRouterProvider) {
        // routes which are not in our map are redirected to /tab/setting
        $urlRouterProvider.otherwise(
            function () {
                return '/'
            }
        );
    }])
    .config(
    function ($stateProvider) {
        $stateProvider
            //.state('tab', {            // setup an abstract state for the tabs directive
            //    url: "/tab",
            //    abstract: true,
            //    templateUrl: "templates/tabs.html",
            //    resolve: {
            //        // controller will not be loaded until $requireAuth resolves
            //        // Auth refers to our $firebaseAuth wrapper in the example above
            //        "currentAuth": ["simpleLogin",
            //            function (simpleLogin) {
            //                // $requireAuth returns a promise so the resolve waits for it to complete
            //                // If the promise is rejected, it will throw a $stateChangeError (see above)
            //                return simpleLogin.auth.$requireAuth();
            //            }]
            //    }
            //})

            // the setting tab has its own child nav-view and history
            .state('setting', {
                url: '/setting',
                templateUrl: 'templates/setting.html'
            })
            .state('addSAPUser', {
                url: '/addSAPUser',
                controller: "addSAPUserCtrl",
                templateUrl: 'scripts/setting/add-sap-user.html'
            })
            .state('task-success', {
                url: '/task-success',
                //controller: "taskSuccessCtrl",
                templateUrl: 'scripts/purchase-orders/task-success.html'
            })
            .state('taskDetail', {
                url: '/taskDetail/:task',
                templateUrl: 'scripts/purchase-orders/task-detail.html',
                controller: "taskDetailCtrl",
                resolve: {
                    returnMessage: function ($q, $firebaseObject, $rootScope, fbutil, $stateParams) {
                        var d = $q.defer();
                        console.log('x');
                        $firebaseObject(fbutil.ref(['tasks', $rootScope.serverUser, $stateParams.task, 'RETURN']))
                            .$loaded().then(function (data) {
                                d.resolve(data);
                            });
                        return d.promise;
                    }
                }
            })
            .state('ionListView', {
                url: '/ionListView/:viewName/:index?key',
                templateUrl: 'scripts/purchase-orders/ion-list-template.html',
                controller: 'ionListViewCtrl',
                resolve: {
                    stateParamsObject: function (fbutil, ionicLoading, $stateParams) {
                        var obj = {
                            viewName: $stateParams.viewName,
                            key: $stateParams.key,
                            ref: fbutil.ref([$stateParams.index]),
                            scroll: 'key()'
                        };
                        console.log($stateParams.viewName);
                        switch ($stateParams.viewName) {
                            case 'E0001':
                                return angular.extend(obj, {
                                    ref: fbutil.ref([$stateParams.index, 'PO_HEADERS'])
                                });
                                break;
                            case 'E0004':
                                return angular.extend(obj, {
                                    ref: fbutil.ref([$stateParams.index, 'REQUIREMENT_ITEMS'])
                                });
                                break;
                            case 'E0022':
                                console.log('x');
                                return angular.extend(obj, {
                                    ref: fbutil.ref(['Event/E0022/100001/CATSRECORDS_OUT'])
                                });
                                break;
                            default:              //'E0001-item' || 'E0002' || 'E0004-item' || 'E0005' || 'E0005-item'
                                return obj;
                                break;

                        }
                    }
                }
            })
            .state('ionListESView', {
                url: '/ionListESView/:table/?key?value',
                templateUrl: 'scripts/purchase-orders/es-list-template.html',
                controller: 'ionListESViewCtrl',
                resolve: {
                    stateParamsObject: function (jsonFactory,$state, ESService, ionicLoading, $q, $stateParams) {
                        var d = $q.defer();
                        console.log($stateParams.key);

                        console.log( $stateParams.value);
                        jsonFactory.loadData($stateParams.table, $stateParams.key, $stateParams.value)
                            .then(function (results) {
                                    console.log(results);
                                    //列表才显示，只有一条跳转其他
                                    if (!angular.isArray(results)) {
                                        console.log('1 row');

                                        $state.go('searchDetail',
                                            {
                                                table: $stateParams.table,
                                                key: $stateParams.key, value: $stateParams.value
                                            });
                                        d.reject('1 row');
                                    } else {
                                        d.resolve({
                                            array: results,
                                            table: $stateParams.table
                                        });
                                    }
                                }).catch(function (err) {
                                    console.log(err);
                                    d.reject(err);
                                });

                        return d.promise;

                    }
                }
            })

        ;


        // if none of the above states are matched, use this as the fallback
        //isAuthenticated is set below in the .run() command
        //$urlRouterProvider.otherwise(
        //    function () {
        //if (isAuthenticated) {
        //    console.log('isAuthenticated', isAuthenticated);
        //    return '/tab/setting'
        //} else {
        //    console.log('isAuthenticated', isAuthenticated);
        //    return '/login'
        //}
        //    }
        //);
    }
);
