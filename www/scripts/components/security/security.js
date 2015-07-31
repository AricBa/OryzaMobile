(function (angular) {
    "use strict";

    angular.module('myApp.security', ['myApp.config', 'myApp.services.ionic'])


    /**
     * Apply some route security. Any route's resolve method can reject the promise with
     * { authRequired: true } to force a redirect. This method enforces that and also watches
     * for changes in auth status which might require us to navigate away from a path
     * that we can no longer view.
     */

        // do all the things ionic needs to get going
        .run(function ($rootScope, fbutil, Auth, $q,
                       loginRedirectPath, $firebaseAuth, $firebase, $window,
                       $location, $timeout, $firebaseObject) {

            Auth.$onAuth(function (authData) {
                if (authData) {
                    $rootScope.authData = authData;
                    console.log(authData);
                    console.log("Logged in as:", authData.uid);
                } else {
                    console.log("Logged out");
                    $location.path(loginRedirectPath);
                }
            });

            $rootScope.notify = function (text) {
                $rootScope.show(text);
                $window.setTimeout(function () {
                    $rootScope.hide();
                }, 1999);
            };

            $rootScope.$on("$stateChangeError",
                function (event, toState, toParams, fromState, fromParams, error) {

                    // We can catch the error thrown when the $requireAuth promise is rejected
                    // and redirect the user back to the home page
                    if (error === "AUTH_REQUIRED") {
                        $location.path(loginRedirectPath);
                    }
                });

        })

        // rootScrop Initialization
        .run(function ($rootScope, $location,fbutil, Auth, $q,
                       loginRedirectPath, $firebaseAuth, $firebase, $timeout, $firebaseObject) {


            //$rootScope.fbConnection
            //$rootScope.serverUser

            var connectedRef = fbutil.ref(['.info/connected']);
            connectedRef.on("value", function(snap) {
                if (snap.val() === true) {
                    $rootScope.fbConnection=true;
                    console.log("fb connected");
                } else {
                    $rootScope.fbConnection=false;
                    console.log("not connected");
                }
            });

            Auth.$onAuth(function (authData) {
                if (authData) {

                    var ref = fbutil.ref(['profiles', authData.uid]);

                    ref.on('child_changed', function (childSnapshot, prevChildKey) {
                        $rootScope.$broadcast('rootScopeUpdate',true);
                        $rootScope[childSnapshot.key() + '_new'] = true;
                    });
                    ref.on('child_added', function (childSnapshot, prevChildKey) {
                    });

                    $firebaseObject(ref)
                        .$bindTo($rootScope, 'profiles').then(function () {
                            //if(typeof $rootScope.profiles['SAPUser'] ==="undefined"){
                            //
                            //}else{
                            //    $location.path('/addSAPUser');
                            //}
                            $rootScope.serverUser=$rootScope.profiles.serverUser;
                            $rootScope.$broadcast('rootScopeInit',true);

                            var ref = fbutil.ref(['tasks', $rootScope.profiles.serverUser]);

                            ref.on('child_changed', function (childSnapshot, prevChildKey) {
                                console.log(childSnapshot.key());
                                console.log(childSnapshot.val());
                            });


                        }
                    );
                    $rootScope.$watch('profiles', function (newValue, oldValue) {
                        if (typeof newValue !== "undefined") {
                            //if (newValue.E0002.priority === '3') {
                            //    $location.path(loginRedirectPath);
                            //}
                        }
                    });
                }
            });
        })
        .service("hiEventService",function($rootScope) {
            this.broadcast = function() {$rootScope.$broadcast("hi")}
            this.listen = function(callback) {$rootScope.$on("hi",callback)}
        })
    ;

})(angular);

