test("testPrimitiveSaveLoad", function () {

    var jsonModel = { number: 1,
        str : "aString",
        bool : true,
        nil: null,
        undef: undefined
        };


    var m = new Model(jsonModel);

    ok(JSON.stringify(m.toJSON()) === JSON.stringify(jsonModel), "Passed");
});

test("testPrimitiveSetGet", function () {

    var jsonModel = { number: 1,
        str : "aString",
        bool : true,
        nil: null,
        undef: undefined
        };


    var m = new Model(jsonModel);
    ok(m.str._value === jsonModel.str, "Passed");
    ok(m.number._value === jsonModel.number, "Passed");
    m.str._value  = 1;
    m.number._value = "aString";

    var jsonModelExpected = { number: "aString",
        str : 1,
        bool : true,
        nil: null,
        undef: undefined
        };

    ok(JSON.stringify(m.toJSON()) === JSON.stringify(jsonModelExpected), "Passed");
});

test("testObjectsSaveLoad", function () {
    var jsonModel = {   number: 1,
                        str : "aString",
                        subModel: {
                            str2: "string2"
                        }
                    };
    var m = new Model(jsonModel);
    ok(JSON.stringify(m.toJSON()) === JSON.stringify(jsonModel), "Passed");
});

test("testFunctionsSaveLoad", function () {

    var jsonModel = {   number: 1,
                        str : "aString",
                        x: function () {return "I am function x";},
                        subModel: {
                            str2: "string2",
                            f: function () {return "I am a function";}
                        }
                    };
    var jsonXReturnValue = jsonModel.x();
    var jsonFReturnValue = jsonModel.subModel.f();

    var m = new Model(jsonModel);
    var modelXReturnValue = m.x._value();
    var modelFReturnValue = m.subModel.f._value();
    ok(jsonXReturnValue === modelXReturnValue, "Passed");
    ok(jsonFReturnValue === modelFReturnValue, "Passed");

    var jsonFromModel = m.toJSON();

    ok(JSON.stringify(jsonFromModel) === JSON.stringify(jsonModel), "Passed");

});

test("testChangeListenerCallback", function () {
        var jsonModel = { number: 1,
        str : "aString",
        bool : true,
        nil: null,
        undef: undefined
        };

    var count = 0;
    var m = new Model(jsonModel);
    var f = function (oldValue, newValue) {
        count++;
    };
    m.number.onChange(f);
    m.number._value = 2;
    m.number._value = 3;
    m.number._value = 3; // value is the same should not fire a change

    ok(count === 2, "Passed");

});


test("testModelCreationFromScratch", function () {
    var expectedJSON = {
        x: 1,
        y: "y",
        obj: {
            desc: "a New point"
        },
        obj2: {
            desc: "This is obj2"
        }
    };

    var m = new Model();
    m.createProperty("x", 1);
    m.createProperty("y", "y");

    var subModel = new Model();
    subModel.createProperty("desc", "a New point");
    m.obj = subModel;

    // alternate - just pass in JSON
    m.createProperty("obj2", {desc: "This is obj2"});


    ok(JSON.stringify(m.toJSON()) === JSON.stringify(expectedJSON), "Passed");
});

test("testComplexChangePropertyValue", function () {
    var json = {
        x: 1,
        y: "y",
        obj1: "This is not obj1",
        obj2: "This is not obj2"
    };
    var expectedJSON = {
        x: 1,
        y: "y",
        obj1: "This is not obj1",
        obj2: {
            desc: "This is obj2"
        }
    };

    var m = new Model(json);

/* This isn't passing yet. Since _parent of property is immutable. Think about it.
    var subModel = new Model();
    subModel.createProperty("desc", "This is obj1");
    m.obj._value = subModel;
 */
    // alternate
    m.obj2._value = {desc: "This is obj2"};

    ok(JSON.stringify(m.toJSON()) === JSON.stringify(expectedJSON), "Passed");
});

test("testSuppressNotifications", function () {
        var jsonModel = {
            x: 1,
            y: "y",
            obj: {
                desc: "a New point"
            }
        };

    var m = new Model(jsonModel);
    var notified = false;
    var callback = function (oldValue, newValue) {
        notified = true;
    };

    m.x.onChange(callback);
    m.x._value = 2;
    ok(notified, "Passed");
    notified = false;
    m.x._value = {_value: 4, suppressNotifications: true}; //special object setting
    ok(!notified, "Passed");
    ok(m.x._value === 4, "Passed");
});

test("testPropertyValidationFunction", function () {

    var validateX = function (value){
        return value > 0;
    };
    var m = new Model();
    m.createProperty("x", 1, {validator: validateX});
    m.createProperty("y", "y");
    ok(m.x._value === 1, "Passed");
    m.x._value = 5;
    ok(m.x._value === 5, "Passed");
    m.x._value = -1;
    ok(m.x._value === 5, "Passed");

});


test("testSaveLoadWithMetaData", function () {

    var expectedJSON = {
        x: 1,
        x__modeljs__options: {
            validator: function (value){
                return value > 0;
            }
        }
    };

    var validateX = function (value){
        return value > 0;
    };

    var m = new Model();
    m.createProperty("x", 1, {validator: validateX});

    ok(JSON.stringify(m.toJSON(true)) === JSON.stringify(expectedJSON), "Passed");

    var m2 = new Model(expectedJSON);
    ok(JSON.stringify(m.toJSON(true)) === JSON.stringify(expectedJSON), "Passed");
});

test("testModelTransactions", function () {
    var jsonModel = { number: 1,
        str : "aString",
        bool : true,
        nil: null,
        undef: undefined
        };

    var callbackCalled = false;
    var count = 0;
    var callback = function (oldValue, newValue) {
        callbackCalled = true;
        count++;
    };

    var m = new Model(jsonModel);
    m.number.onChange(callback);
    m.bool.onChange(callback);
    Model.startTransaction();
    m.number._value = 5;
    m.bool._value = true; //should not fire a onChange event since value not changes

    ok(!callbackCalled, "Passed");
    Model.endTransaction();
    ok(callbackCalled, "Passed");
});

test("testBubbleUpEvents", function () {
    var jsonModel = {
        number: 1,
        str: "aString",
        bool: true,
        nil: null,
        undef: undefined,
        subModel: {
            subProp: "I am the subProp"
        }
    };

    var callbackCalled = false;
    var count = 0;
    var callback = function (oldValue, newValue) {
        callbackCalled = true;
        count++;
    };

    var m = new Model(jsonModel);
    m.onChange(callback, {listenToChildren: true});
    m.number.onChange(callback);

    m.number._value = 5;
    ok(callbackCalled, "Passed");

    ok(count===2, "Passed");
});

test("modlejsTutorial", function (){

    //The code below will teach you how to use modeljs by example. It attepts to go though all the features in logical progression.

    /** First thing you will want to do is create your model.
    * If starting from scratch there are two ways to proceed.
    * 1. Create it from a JSON object or
    * 2. Create it programatically.
    * method 3, from an already saved modeljs JSON object will be demonstrated later.
    */

    /** --- method 1: create a model from a JSON object --- */
    // models can have anything you could put in a JavaScript object
    var modelAsJSON = {
        numberProperty: 1,
        stringProperty: "string",
        boolProperty: true,
        nullProperty: null,
        undefProperty: undefined,
        objProperty: {
            name: "point",
            value: {
                x: 2,
                y: 8,
                desc: "a complex value"
            },
            desc: "This is demonstrating the recursive ability of creating your model"
        },
        objProperty2: {
            value1: "a",
            value2: "b"
        },
        functionProperty: function () {
            return "This is a function";
        }
    };

    var modelFromJSON = new Model(modelAsJSON);

    /** --- method 2: creating your model programatically --- */
    var modelFromCode = new Model(); //creates a empty model equivlant of new Model({});
    // create properties via the createProperty method
    model.createProperty("PropertyName", "property Value");
    model.createProperty("number", 1); // value can be of any type
    // like another model
    model.createProperty("obj", new Model({"subModel": "I am a inlined Model object"}));
    // An alternate to the above with the same result would be:
    model.createProperty("obj2", {"submodel2": "a better way to programatically set a property to a submodel"}); //This is recommended.
    // the createProperty method can also take options like a validator function
    model.createProperty("positiveNumber", 2, {validator: function (value){return typeof value === 'number' && value > 0;}});
    // Validator functions get run when you try to change the property value.
    // It take the newValue to be set as the arguement and returns true if the value.
    // If the value is not valid it will not be set and the property remains unchanged.
    // Note validators can only be bound to the property at creation time.
    // Let look at how we can set/change property values

    /** --- Model manipulation --- */
    //getting/setting a model value behaves simarly to  like JavaScript Objects.
    // This is a getter. it retieves the value 1
    var numberPropertyValue = modelAsJSON.numberProperty._value;
    //This sets the Property value to 2;
    modelFromJSON.numberProperty._value = 2;
    // We can set the property to anything, but remember it must pass the validator.
    // This string will fail the positiveNumber validator. _value will still be 2
    modelFromCode.positiveNumber._value = "a String";

    //if you don't like the silent failure you can use these methods to check if a validator exists
    modelFromCode.positiveNumber.hasValidator();
    modelFromCode.positiveNumber.validate("a String"); // or even do the test yourself

    //you can even use set notation to change the value to a complex type like a model
    //TODO bug doesn't work
    //modelFromCode.obj._value = new Model({"subModel": "A submodel set via the '_value = (Model)' setter"});
    //a better way to do this is just using JSON notation
    modelFromCode.obj._value = {"submodel": "A submodel set via the '_value = {}' setter"};

    // Although if your using JSON notation be mindful if the JSON object has a _value property it will be treated specially
    // Here the property _value indicates the value and the other properties are options. acceptable options are:
    // suppressNotifications - which does not call any of the registered listeners.
    modelFromCode.obj._value = {_value: "submodel",
        suppressNotifications: true
    };

    // The next section will talk about events


    /* --- Events --- */
    /** The core responsibility of the Model in the MVC patter is to notify the view when the model changes */
    // using modeljs the you can listen to when any model property value changes by registaring a callback.
    // below is a example
    var callbackCount = 0;
    function callback (oldValue, newValue){
        callbackCount+=1;
    }
    modelFromJSON.numberProperty.onChange(callback);

    // Now whenever you change the value of numberProperty the callback will be called, unless the value was
    // set with the suppressNotifications set to true.

    // The callback can be put on any property
    // this is on a objProperty object. It only gets called when the objProperty changes not any of it's children
    modelFromJSON.objProperty.onChange(calllback);
    // This is attaching the same listener to a child property of objProperty
    modelFromJSON.objProperty.name.onChange(calllback);

    // If you want to listen to anyProperty changes of a Property and its children you can register you callback to do so.
    modelFromJSON.objProperty2.onChange(callback, {listenToChildren: true}); // callback will be called with objProperty2 or it's children change value
    //this is recomended as oppose to registaring the same listener on all children.

    // Finally another useful feature is delaying your callbacks until your done munipulating the model
    // To do that you create a transaction like below.
    
    Model.startTransaction();
    //any code in here will not notify it's listeners until Model.endTransaction() is called
    modelFromJSON.stringProperty._value = "new String Property";
    modelFromJSON.objProperty.name._value = "new name";

    // it doesn't matter how you set the value or which Model you are manipulating. Transaction apply to everything
    modelFromCode.numberProperty.onChange(callback);
    modelFromCode.numberProperty._value = 8;
    Model.endTransaction();

    // To check if your in a transaction block you can call
    Model.inTransaction();
    //Finally there is away to optimize your callbacks


    // registering, bubbling, transactions, suppressing

    /* --- Saving and Loading from saved --- */

});