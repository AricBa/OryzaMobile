(function (angular) {
    "use strict";

    var app = angular.module('myApp.home', ['ionic', 'firebase.simpleLogin',
        'firebase.utils', 'firebase']);
    app

        .controller('sideBarCtrl', function (localStorageService,
                                             $scope, $state, $translate, $q, homeFactory, ionicLoading) {
            $scope.changeLanguage = function (langKey) {
                console.log(langKey);
                $translate.use(langKey);
            };
            //ionicLoading.load();

        })
        .controller('homeCtrl', function ($timeout,fbutil, $q, localStorageService,
                                          $scope, $state, $log, $rootScope, ionicLoading, $ionicSideMenuDelegate) {

            $scope.openMenu = function () {
                $ionicSideMenuDelegate.toggleLeft();
            };

            ionicLoading.load();
            $scope.objectSize = function(obj) {
                var size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) size++;
                }
                return size;
            };
            $scope.$on("rootScopeInit",function(even,data){
                ionicLoading.unload();
                if(data===true){
                    $timeout(function() {
                        ionicLoading.unload();
                    }, 1000);
                    ionicLoading.load();
                    console.log($scope.profiles);

                }

            });

            $scope.viewtitle = angular.uppercase($state.current.name);

            $scope.$state = $state;

            $scope.refresh = function () {

                $scope.$broadcast('scroll.refreshComplete');
            };

            $scope.$on('$destroy', function () {
                $log.info('is no longer necessary');
            });
        });

    app.factory('homeFactory',
        function ($rootScope, $firebaseObject, fbutil, $q, FIREBASE_URL) {
            var homeFactory = {};
            homeFactory.ready = function (event) {

                var promises = [];
                var deffered = $q.defer();

                var user = $rootScope.profiles.serverUserID;
                console.log(user);
                fbutil.ref(['Event', event])
                    .startAt(user)
                    .endAt(user)
                    .once('value', function (snap) {
                        snap.child(user).ref().once('value', function (snap) {
                            if (event === 'A0001') {
                                if (typeof snap.val() == "undefined" ||
                                    snap.child('TASK_INFO').child('task_status').val() !== '3') {
                                    deffered.reject('no data');
                                } else {
                                    deffered.resolve({
                                        "serverUserID": user,
                                        "SAP_LANGUAGE": snap.child('TASK_INFO').child('SAP_LANGUAGE').val(),
                                        "SAP_PASSWORD": snap.child('TASK_INFO').child('SAP_PASSWORD').val(),
                                        "SAP_USER": snap.child('TASK_INFO').child('SAP_USER').val(),
                                        "task_status": snap.child('TASK_INFO').child('task_status').val()
                                    });
                                }
                            }
                            if (event !== 'A0001') {
                                var Array = [];
                                snap.forEach(function (childSnapshot) {
                                    Array.push({
                                        "name": childSnapshot.key(),
                                        "url": childSnapshot.ref().toString().replace(childSnapshot.ref().root().toString(), '')
                                    });
                                });
                                var node = {
                                    "name": event,
                                    "show": true,
                                    "url": snap.ref().toString().replace(FIREBASE_URL, ''),
                                    "array": Array
                                };
                                if (Array.length === 0) {
                                    node.show = false
                                }
                                console.log(node);
                                deffered.resolve(node);
                            }
                        }, function (err) {
                            // code to handle read error
                            deffered.reject({
                                "event": event,
                                "error": err
                            });
                        });
                    });
                promises.push(deffered.promise);
                return $q.all(promises);
            };

            return homeFactory;
        });

    app.config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'scripts/home/home.html',
                controller: 'homeCtrl',
                resolve: {
                    // controller will not be loaded until $requireAuth resolves
                    // Auth refers to our $firebaseAuth wrapper in the example above
                    "currentAuth": ["simpleLogin",
                        function (simpleLogin) {
                            // $requireAuth returns a promise so the resolve waits for it to complete
                            // If the promise is rejected, it will throw a $stateChangeError (see above)
                            return simpleLogin.auth.$requireAuth();
                        }]

                }
            })
           ;
    }]);
})(angular);