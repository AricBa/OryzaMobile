(function (angular) {
    "use strict";

    var app = angular.module('myApp.sapValidation', ['ionic', 'firebase.simpleLogin',
        'firebase.utils', 'firebase']);

    app.controller('addSAPUserCtrl',
        function ($firebaseObject, $rootScope, fbutil, $q, homeFactory, myTask, $scope, ionicLoading, $ionicPopup) {
            var event='A0001';
            $scope.popup = {
                title: '',
                template: ''
            };
            console.log($rootScope.serverUser);
            $scope.$watch('user',function(oldvalue,newvalue){
                console.log(oldvalue+' '+newvalue);
            });
            $scope.user='LIMIL';
            $scope.password='mingming';
            $scope.language='E';
            $scope.taskData = {
                event: event,
                serverUserID: $rootScope.serverUser, //$scope.ServerUserID
                inputParasRef: $scope.user+'/'+$scope.password+'/'+$scope.language,
                jsonContent: ''
            };
        })
        .controller('A0001Ctrl',
        function ($firebaseObject, $rootScope, fbutil, $q, homeFactory, myTask, $scope, ionicLoading, $ionicPopup) {

            ionicLoading.load();
            $scope.showPopup = function () {
                $scope.data = {}

                // An elaborate, custom popup
                var myPopup = $ionicPopup.show({
                    template: '<div class="list"><div class="item item-divider">SAP_System </div> ' +
                    '<a ng-repeat="data in SAPSysArray" class="item">{{ data.$value }}</a> </div>',
                    title: 'Enter Wi-Fi Password',
                    subTitle: 'Please use normal things',
                    scope: $scope,
                    buttons: [
                        {text: 'Cancel'}
                    ]
                });
                myPopup.then(function (res) {
                    console.log('Tapped!', res);
                });
                $timeout(function () {
                    myPopup.close(); //close the popup after 3 seconds for some reason
                }, 3000);
            };

            var setDraft = function () {
                var d = $q.defer();
                homeFactory.ready('A0001').then(function (data) {
                    var ref = fbutil.ref(['users', $rootScope.authData.uid, 'SAPUser'])
                        .child('draft')
                    ref.set(data[0], function (error) {
                        if (error) {
                            d.reject(error);
                        } else {
                            $firebaseObject(ref).$bindTo($scope, "model");
                            d.resolve(data);
                        }
                    });
                }).catch(function (error) {
                    console.log(error);
                });
                return d.promise;
            };
            setDraft().then(function (data) {

                ionicLoading.unload();
                $scope.taskData = {
                    event: event,
                    serverUserID: data[0].serverUserID, //$scope.ServerUserID
                    inputParasRef: data[0].SAP_USER + '/' + data[0].SAP_PASSWORD + '/' + data[0].SAP_LANGUAGE,
                    jsonContent: ''
                };
                console.log($scope.taskData);
            });


            //TODO 如果密码已经存在，可以进行修改操作；如果不存在，进行密码验证。
            //create A0001 task with A0001 input parameters

//            $scope.languages = myUser.getLanguage();
////          ionicLoading.load();
//            $scope.$on('lock.update', function (event) {
//                $scope.lock = myUser.getStatus('lock');
//            });$scope

            $scope.changedValue = function (language) {
                $scope.model.language = language;
            };
            $scope.change = function (user, nodeName) {
                if (!angular.isDefined(user[nodeName])) {
                    console.log(user[nodeName]);
                    user[nodeName] = null;
                }
            };
            //   {user/password/valid/language}
            //SAPUser.$bindTo($scope, "model").then(function () {
            //
            //    if (typeof $scope.model.language !== 'undefined') {
            //        $scope.preflang = $scope.model.language;
            //    } else {
            //        $scope.preflang = '1';
            //    }
            //    if (!$scope.model.valid) {
            //        $scope.buttontext = 'validate';
            //    } else {
            //        $scope.buttontext = 'update';
            //    }
            //
            //    if (typeof $scope.model.lock !== 'undefined') {
            //
            //        $scope.lock = $scope.model.lock;
            //    } else {
            //        $scope.lock = false;
            //    }
            //});
            //$scope.SAPSysArray = myUser.getSAPSys();
            $scope.popup = {
                title: '',
                template: ''
            };
            $scope.taskData = {
                event: event,
                serverUserID: '', //$scope.ServerUserID
                inputParasRef: '',
                jsonContent: ''
            };
//            myTask.getInputP('A0001').$loaded().then(function (data) {
//
//                $scope.SAPSysArray.$loaded()
//                    .then(function () {
//                        var inputParas = data.$value;
//                        inputParas = inputParas.replace('$P00$', $rootScope.serverUser);//ServerUserID
//                        $scope.SAPSysArray.forEach(function (entry) {
//                            switch (entry.$id.toUpperCase()) {
//                                case 'SAP_SYSTEM_GUID':
//                                    inputParas = inputParas.replace('$P01$', entry.$value);
//                                    break;
//                                case 'SYSTEM_ID':
//                                    inputParas = inputParas.replace('$P02$', entry.$value);
//                                    break;
//                                case 'SERVER_NAME':
//                                    inputParas = inputParas.replace('$P03$', entry.$value);
//                                    break;
//                                case 'INSTANCE_NUMBER':
//                                    inputParas = inputParas.replace('$P04$', entry.$value);
//                                    break;
//                                case 'CLIENT':
//                                    inputParas = inputParas.replace('$P05$', entry.$value);
//                                    break;
//                            }
//                        });
//                        $scope.inputParas = inputParas;
//                        ionicLoading.unload();
//                    });
//            });
////
            $scope.tryValidation = function () {
                $scope.inputParas = $scope.inputParas.replace('$P06$', $scope.model.user);
                $scope.inputParas = $scope.inputParas.replace('$P07$', $scope.model.password);
                $scope.inputParas = $scope.inputParas.replace('$P08$', $scope.preflang);
                console.log($scope.inputParas);
//            myTask.createTask('A0001', $scope.inputParas,
//                'SAPValidation', $scope.clickEvent, buildParms());
                myTask.createTask('A0001', $rootScope.serverUser,
                    $scope.inputParas, 'A0001', 'Approve');
                $scope.model.lock = true;
            };

        });

    app.config(['$stateProvider', function ($stateProvider) {
        $stateProvider.state('A0001', {
            url: '/A0001',
            templateUrl: 'scripts/setting/sap-user-validation.html',
            controller: 'A0001Ctrl'
            //,
            //resolve: {
            //    SAPUser: function (homeFactory, $rootScope,$stateParams,ionicLoading, fbutil, $firebaseObject, $q) {
            //        var d = $q.defer();
            //        ionicLoading.load();
            //        homeFactory.ready('A0001').then(function (data) {
            //            ionicLoading.unload();
            //            fbutil.ref(['users', $rootScope.authData.uid, 'SAPUser'])
            //                .child('draft').set(data[0], function (error) {
            //                if (error) {
            //                    d.reject(error);
            //                } else {
            //                    d.resolve(data);
            //                }
            //            });
            //        });
            //        return d.promise;
            //    }
            //}
        });
    }]);
})(angular);