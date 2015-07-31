(function (angular) {
    "use strict";

    var app = angular.module('myApp.purchaseOrderList', []);




    app.controller('taskDetailCtrl',
        function (returnMessage,ionicLoading, $state,
                  $location, $timeout, $scope,jsonFactory) {
            $scope.data=returnMessage;
        })

        .controller('ionListESViewCtrl',
        function (ionicLoading, stateParamsObject,$state,
                  $location, $timeout, $scope,jsonFactory) {
            console.log(stateParamsObject);
            $scope.results = stateParamsObject.array;
            jsonFactory.hospitals('search-lists').then(function (data) {
                if(typeof data[stateParamsObject.table].primaryKey === 'string'){

                    $scope.primaryKey = data[stateParamsObject.table].primaryKey;
                }else{
                    $scope.primaryKeys=[];
                    angular.forEach(data[stateParamsObject.table].primaryKey,function(key){
                        $scope.primaryKeys.push(key);
                    });
                }


                $scope.searchLink = data[stateParamsObject.table].searchLink;
            });
            $scope.go= function (data) {
                var valueArr=[];
                angular.forEach($scope.primaryKeys,function(key){
                    valueArr.push(data[key]);

                });
                //console.log(valueArr);
                //console.log($scope.primaryKeys);
                $state.go('searchDetail',
                    {table:$scope.searchLink,key:$scope.primaryKeys,value:valueArr});

            }
        })
        .controller('ionListViewCtrl',
        function (ionicLoading, stateParamsObject, $firebaseArray, $state,
                  $location, $timeout, $scope) {
            $scope.stateParamsObject = stateParamsObject;
            $scope.lowercase_viewName = angular.lowercase(stateParamsObject.viewName);

            $scope.condition = function (ref) {
                var deferred = $q.defer();
                fbutil.ref([ref]).once('value', function (snap) {
                    deferred.resolve(snap.val() === null);
                });
                return deferred.promise;
            };

            var scrollRef = new Firebase.util
                .Scroll($scope.stateParamsObject.ref, $scope.stateParamsObject.scroll);

            ionicLoading.load('loading');
            // create a synchronized array on scope
            $scope.ionList = {
                array: $firebaseArray(scrollRef),
                ref: scrollRef.toString().replace(scrollRef.root().toString(), '')
            };
            // load the first three records
            scrollRef.scroll.next(3);
            $scope.ionList.array.$loaded()
                .then(function () {
                    ionicLoading.unload();
                });

            $scope.refresh = function () {
                //TODO refresh event
                console.log('$scope.refresh');
                $scope.$broadcast('scroll.refreshComplete');
            };
            // This function is called whenever the user reaches the bottom
            $scope.loadMore = function () {
                // load the next contact
                scrollRef.scroll.next(1);
                if (!scrollRef.scroll.hasNext()) {
                    console.log('no more');
                }
                $scope.$broadcast('scroll.infiniteScrollComplete');
            };
        })

        .directive('eatClickIf', ['$parse', '$rootScope',
            function ($parse, $rootScope) {
                return {
                    priority: 100,
                    restrict: 'A',
                    compile: function ($element, attr) {
                        var fn = $parse(attr.eatClickIf);
                        return {
                            pre: function link(scope, element) {
                                var eventName = 'click';
                                element.on(eventName, function (event) {
                                    var callback = function () {
                                        if (fn(scope, {$event: event})) {
                                            event.stopImmediatePropagation();
                                            event.preventDefault();
                                            return false;
                                        }
                                    };
                                    if ($rootScope.$$phase) {
                                        scope.$evalAsync(callback);
                                    } else {
                                        scope.$apply(callback);
                                    }
                                });
                            },
                            post: function () {
                            }
                        }
                    }
                }
            }
        ]);
})(angular);