(function (angular) {
    "use strict";

    var app = angular.module('myApp.purchaseOrder', []);

    app

        .controller('purchaseRequestItemCtrl',
        function ($q, ESService, screenFormat, myTask, ionicLoading,
                  approveItem, $ionicPopup, $timeout, $scope, $ionicPopover) {

// .fromTemplate() method
            var template = '<ion-popover-view><ion-header-bar> ' +
                '<h1 class="title">My Popover Title</h1> </ion-header-bar> ' +
                '<ion-content> Hello! </ion-content></ion-popover-view>';

            $scope.popover = $ionicPopover.fromTemplate(template, {
                scope: $scope
            });

            // .fromTemplateUrl() method
            $ionicPopover.fromTemplateUrl('my-popover.html', {
                scope: $scope
            }).then(function (popover) {
                $scope.popover = popover;
            });


            $scope.openPopover = function ($event) {
                $scope.popover.show($event);
            };
            $scope.closePopover = function () {
                $scope.popover.hide();
            };
            //Cleanup the popover when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.popover.remove();
            });
            // Execute action on hide popover
            $scope.$on('popover.hidden', function () {
                // Execute action
            });
            // Execute action on remove popover
            $scope.$on('popover.removed', function () {
                // Execute action
            });

            ionicLoading.load('Loading');


            $scope.getFieldValue = function (fieldFormatArray) {
                var arr = [];
                var d = $q.defer();
                var i = 0;
                angular.forEach(fieldFormatArray, function (value) {
                    //如果要lookup
                    if (typeof value['LKP_KEY'] !== 'undefined' && value['LKP_KEY'] !== '') {
                        ESService.lookup(value['LKP_TABLE'], value['LKP_KEY'],
                            $scope.data[value['NAME']], value['LKP_TEXT'],
                            value['LKP_FOREIGNKEY1'], $scope.data[value['LKP_FOREIGNKEY1']],
                            value['LKP_FOREIGNKEY2'], $scope.data[value['LKP_FOREIGNKEY2']])
                            .then(function (result) {
                                i++;
                                arr[value.$id] = result + '(' + $scope.data[value['NAME']] + ')';
                                //console.log(key);
                                if (i == fieldFormatArray.length) {
                                    d.resolve(arr)
                                }
                            })
                    } else {
                        i++;
                        arr[value.$id] = $scope.data[value.NAME];
                        if (i == fieldFormatArray.length) {
                            d.resolve(arr)
                        }
                    }
                });
                return d.promise;
            };
            screenFormat('E0001_header').then(function (data) {
                    $scope.fieldList = data;
                    $scope.getFieldValue(data).then(function (data) {
                        $scope.fieldValueArray = data;
                    });
                }
            );

            approveItem.obj.$bindTo($scope, "data").then(function () {
                ionicLoading.unload();

                var ref = approveItem.obj.$ref().toString();
                var refStr = approveItem.obj.$ref().toString().replace(approveItem.obj.$ref().root().toString(), '');
                var res = ref.split("/");

                if (approveItem.event === 'E0005') {
                    $scope.ServerUserID = res[5];
                    $scope.PURCHASEREQUEST = res[8];
                    $scope.ITEM = res[9];
                    $scope.keyText = 'Purchase Request Approve';
                    $scope.keyID = $scope.PURCHASEREQUEST + ' ' + $scope.ITEM;
                }
                if (approveItem.event === 'E0002') {
                    $scope.ServerUserID = res[5];
                    $scope.PURCHASEORDER = res[8];
                    $scope.purchaseOrderItemsRef = refStr
                        .replace('PO_HEADERS', 'PO_ITEMS');
                    $scope.keyText = 'Purchase Order Approve';
                    $scope.keyID = $scope.PURCHASEORDER;
                }
                $scope.popup = {
                    title: $scope.keyText,
                    template: $scope.keyID
                };
                $scope.taskData = {
                    event: approveItem.event,
                    serverUserID: $scope.ServerUserID,
                    inputParasRef: ref,
                    jsonContent: ''
                };
            });
        });
    app.service('screenFormat', function (fbutil, $rootScope, $firebaseArray, $q) {
        var screenFormat;
        screenFormat = function (screen) {
            var d = $q.defer();
            console.log($rootScope.profiles);
            //var ref = fbutil.ref(['screenFormat', $rootScope.firebaseSync.serverUserID, screen]);

            var ref = fbutil.ref(['screenFormat', '100001', screen]);
            $firebaseArray(ref).$loaded()
                .then(function (data) {
                    d.resolve(data);
                });
            return d.promise;
        };
        return screenFormat;

    })
        .service('approveInfoService', function () {
            var approveInfo = [];

            var addApproveInfo = function (newObj) {
                //productList.push(newObj);
                approveInfo = newObj;
            };

            var getApproveInfo = function () {
                return approveInfo;
            };

            return {
                addApproveInfo: addApproveInfo,
                getApproveInfo: getApproveInfo
            };

        });
    app.controller('approveConformationCtrl', function ($scope, approveInfoService) {
        $scope.approveInfo = approveInfoService.getApproveInfo();
        console.log($scope.approveInfo);
        $scope.approveInfo.returnTime = new Date($scope.approveInfo.createTime + 1000 * 60 * 10)
        console.log($scope.approveInfo.returnTime);
    })
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('approve-conformation', {
                    url: '/approve-conformation',
                    templateUrl: 'scripts/purchase-orders/approve-conformation.html',
                    controller: 'approveConformationCtrl',
                    cache: false
                })
                .state('e0001-header', {
                    url: '/e0001-header/:ref',
                    templateUrl: 'scripts/purchase-orders/e0001-header.html',
                    controller: 'purchaseRequestItemCtrl',
                    cache: true,
                    resolve: {
                        approveItem: function ($stateParams, fbutil, $firebaseObject) {
                            return {
                                event: 'E0002',
                                obj: $firebaseObject(fbutil.ref([$stateParams.ref]))
                            };
                        }
                    }

                })
                .state('purchaseRequestItem', {
                    url: '/purchaseRequestItem/:ref',
                    templateUrl: 'scripts/purchase-orders/purchase-request-item.html',
                    controller: 'purchaseRequestItemCtrl',
                    resolve: {
                        approveItem: function ($stateParams, fbutil, $firebaseObject) {
                            return {
                                event: 'E0005',
                                obj: $firebaseObject(fbutil.ref([$stateParams.ref]))
                            };
                        }
                    }

                });
        }]);
})(angular);