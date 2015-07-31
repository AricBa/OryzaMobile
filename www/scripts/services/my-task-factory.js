/**
 * Created by C5155394 on 2015/3/4.
 */
angular.module('myApp.services.myTask',
    [])
    .factory('fAsync', function (fbutil, $q) {
        var fAsync = function (ref) {
            var d = $q.defer();
            fbutil.ref(ref).once('value', function (snapshot) {
                d.resolve(snapshot.exportVal());
            }, function (err) {
                d.reject(err);
            });
            return d.promise;
        };
        return fAsync;
    })
    .factory('httpUtil', function ($http, $q) {
        var httpUtil;
        httpUtil = {
            httpRequestHandler: function (method, url, data, timeoutNum) {
                var timeout = $q.defer(),
                    result = $q.defer(),
                    timedOut = false,
                    httpRequest;

                if (typeof timeoutNum == 'undefined') {
                    timeoutNum = 0
                }

                setTimeout(function () {
                    timedOut = true;
                    timeout.resolve();
                }, (1000 * timeoutNum));

                httpRequest = $http({
                    method: method,
                    url: url,
                    data: data,
                    cache: false,
                    timeout: timeout.promise
                });

                httpRequest.success(function (data, status, headers, config) {
                    result.resolve(data);
                });

                httpRequest.error(function (data, status, headers, config) {
                    if (timedOut) {
                        //result.reject({
                        //    error: 'timeout',
                        //    message: 'Request took longer than ' + timeoutNum + ' seconds.'
                        //});
                        result.reject('Could not connect to server, Please try again later.');
                    } else {
                        result.reject(data);
                    }
                });

                return result.promise;
            }
        }
        return httpUtil;
    })
    .factory('myTask',
    function ($http, $q, taskUrl, firebaseRef, $rootScope, ionicLoading,
              $timeout, fbutil, fAsync, httpUtil, FIREBASE_URL) {

        var taskDefaultRefStr = 'CompanySetting/EventDefaltValues';
        var SAPSystemRefStr = 'CompanySetting/sap_system/sap_system_guid_default';
        var myTask;

        myTask = {
            getTaskDefaultValue: function (event) {
                return fAsync([taskDefaultRefStr, event]);
            },
            getSAPSys: function () {
                return fAsync([SAPSystemRefStr]);
            },
            createTaskData: function (event, defaultData, ServerUser, inputParasRef, jsonContent) {
                //data.inputParas
                //data.jsonContent
                var d = $q.defer();
                var taskData = defaultData;

                taskData.userId = ServerUser;

                if (typeof defaultData.jsonContent === 'object') {
                    taskData.jsonContent = defaultData.jsonContent;
                    if (event === 'E0025') {
                        taskData.jsonContent.CATSRECORDS[0] = jsonContent;
                    }
                    if (event === 'E0024_CHANGE') {
                        taskData.jsonContent.CATSRECORDS_IN[0] = jsonContent;
                    }
                }

                if (typeof defaultData.inputParas === 'string' && typeof inputParasRef === 'string') {

                    var array = inputParasRef.split("/");
                    var inputParas = defaultData.inputParas;

                    if (event === 'A0001') {
                        myTask.getSAPSys().then(function (data) {
                            angular.forEach(data, function (value, key) {
                                switch (key.toUpperCase()) {
                                    case 'SAP_SYSTEM_GUID':
                                        inputParas = inputParas.replace('$P01$', value);
                                        break;
                                    case 'SYSTEM_ID':
                                        inputParas = inputParas.replace('$P02$', value);
                                        break;
                                    case 'SERVER_NAME':
                                        inputParas = inputParas.replace('$P03$', value);
                                        break;
                                    case 'INSTANCE_NUMBER':
                                        inputParas = inputParas.replace('$P04$', value);
                                        break;
                                    case 'CLIENT':
                                        inputParas = inputParas.replace('$P05$', value);
                                        break;
                                }
                            });

                            inputParas = inputParas.replace('$P06$', array[0]);//SAP_USER
                            inputParas = inputParas.replace('$P07$', array[1]);//SAP_PASSWORD
                            inputParas = inputParas.replace('$P08$', array[2]);//SAP_LANGUAGE

                            taskData.inputParas = inputParas;
                            inputParas = inputParas + ';FB_FROM_PATH=' + inputParasRef.replace(FIREBASE_URL, '');

                            d.resolve(taskData);
                        });

                    } else {
                        if (event === 'E0005') {
                            //E0004->E0005
                            inputParas = inputParas.replace('$P01$', array[6].substr(3));//PO_REL_CODE
                            // TODO replace P02 twice , in the furture use replace-all function
                            inputParas = inputParas.replace('$P02$', array[8]);//PURCHASEREQUEST
                            inputParas = inputParas.replace('$P02$', array[8]);//PURCHASEREQUEST
                            inputParas = inputParas.replace('$P03$', array[9]);//ITEM
                            inputParas = inputParas.replace('$P03$', array[9]);//ITEM
                            inputParas = inputParas.replace('$P04$', array[5]);//ServerUserID
                        }

                        if (event === 'E0002') {
                            //E0001->E0002
                            inputParas = inputParas.replace('$P01$', array[6].substr(3));//PO_REL_CODE
                            inputParas = inputParas.replace('$P01$', array[6].substr(3));//PO_REL_CODE
                            //TODO replace P02 twice , in the furture use replace-all function
                            inputParas = inputParas.replace('$P02$', array[8]);//PURCHASEORDER
                            inputParas = inputParas.replace('$P02$', array[8]);//PURCHASEORDER
                            inputParas = inputParas.replace('$P03$', array[5]);//ServerUserID
                        }

                        inputParas = inputParas + ';FB_FROM_PATH=' + inputParasRef.replace(FIREBASE_URL, '');
                        d.resolve(taskData);
                    }
                }
                return d.promise;

            },
            addTaskKey: function (taskData, taskRef, event) {
                var d = $q.defer();
                //push完新task后，把新生成的key也存下来。
                var onComplete = function () {
                    taskData.inputParas = taskData.inputParas + ';event=' + event +
                    ';FB_PATH=tasks/' + taskData.userId + '/' + newTaskRef.key();
                    newTaskRef.set({
                            event: event,
                            time: new Date(),
                            sendData: taskData
                        },
                        function (error) {
                            if (error) {
                                d.reject(error);
                                console.log("Error:", error);
                            }
                            console.log('new Task' + newTaskRef.key());
                            //newTaskRef.on("value", function (snap) {d.resolve(angular.toJson(snap.val()));});
                            d.resolve({
                                ref: newTaskRef,
                                taskData: taskData
                            });
                        });
                };
                var newTaskRef = taskRef
                    .push({
                        sendData: 'x'
                    }, onComplete);

                return d.promise;
            },
            postTask: function (data) {
                var d = $q.defer();
                //timeout default value is 15
                var httpRequest = httpUtil.httpRequestHandler('POST', taskUrl.url + '/createTask', data, 15);
                httpRequest.then(function (jsonObj) {
                    console.log(jsonObj);
                    d.resolve(jsonObj);
                }, function (error) {
                    console.log(error);
                    d.reject(error);
                });
                return d.promise;
            },
            monitorTask: function (ref) {
                var d = $q.defer();
                ionicLoading.load('wait for results');
                $timeout(function () {
                    ionicLoading.unload();
                    d.reject('timeout');
                    console.log('timeout')
                }, 15000);
                ref.on('child_added', function (childSnapshot, prevChildKey) {
                    if (childSnapshot.key() === 'RETURN') {
                        ionicLoading.unload();
                        ref.once('value', function (snapshot) {
                            if (snapshot.child('TASK_INFO/task_status').val() == 3
                                && snapshot.child('RETURN/TYPE').val() !== ('E' || 'A')) {
                                console.log('successful');
                                d.resolve('successful');
                            }
                            if (snapshot.child('TASK_INFO/task_status').val() == 9) {
                                console.log('error');
                                d.reject('error');
                            }
                        })
                    }
                });
                return d.promise;
            },
            createTask: function (event, ServerUser, inputParasRef, jsonContent) {

                var taskRef = fbutil.ref(['tasks', ServerUser]);
                var d = $q.defer();
                myTask.getTaskDefaultValue(event)
                    .then(function (defaultData) {
                        myTask.createTaskData(event,
                            defaultData, ServerUser, inputParasRef, jsonContent).then(
                            function (taskData) {
                                myTask.addTaskKey(taskData, taskRef, event)
                                    .then(function (data) {
                                        console.log(data);
                                        var ref = data.ref;
                                        myTask.postTask(data.taskData)
                                            .then(function (data) {
                                                //if(event==='A0001'){
                                                    myTask.monitorTask(ref).then(function (data) {
                                                        d.resolve(data);
                                                    }).catch(function(err){
                                                        d.reject(err);
                                                    });
                                                //}
                                                //else{
                                                //    d.resolve('send out');
                                                //}

                                            }).catch(function(err){
                                                d.reject(err);
                                            });
                                    }).catch(function(err){
                                            d.reject(err);
                                        });
                            }
                        );
                    });
                return d.promise;
            }
        };
        return myTask;
    });
