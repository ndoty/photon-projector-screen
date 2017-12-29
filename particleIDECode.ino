//Declare pins
#define stp D0
#define dir D1
#define enable D2
#define epower D3
#define button D4
#define status D7
#define upE A0
#define downE A1
#define upB A2
#define downB A3

// Log message to cloud, message is a printf-formatted string
void debug(String message, int value) {
    char msg [50];
    sprintf(msg, message.c_str(), value);
    Spark.publish("DEBUG", msg);
}

//Declare variables for functions
bool enableSoftwareEndstop = true;
int maxStep = 5000; //Max number of steps for software endstop
bool up = false;
bool down = false;
int upEnd;
int downEnd;
int upButton;
int downButton;
String direction;
int analogThreshold = 3800;
int step = 0;
String lastState = "unkown";
String lastStateEndStop = "unkown";
bool moving = false;
bool particleFunctionStatus = false;

void setup() {
    //Setup our pins
    pinMode(stp, OUTPUT);
    pinMode(dir, OUTPUT);
    pinMode(enable, OUTPUT);
    pinMode(epower, OUTPUT);
    pinMode(status, OUTPUT);
    pinMode(button, OUTPUT);
    
    digitalWrite(epower, HIGH);
    digitalWrite(button, HIGH);

    //To the interwebs
    Particle.function("screen", screenToggle);

    //Lets get ready to rumble
    resetState();
}

void loop() {
    if (up) Particle.publish("Projection_Screen_Raised", "status");

    if (down) Particle.publish("Projection_Screen_Lowered", "status"); 

    upButton = analogRead(upB);
    downButton = analogRead(downB);   
    
    if (!moving) {
        //Button triggered for raising
        if(upButton > analogThreshold && !up) {
            activate("raise");
        }
        
        //Button triggered for lowering
        if (downButton > analogThreshold && !down) {
            activate("lower");
        }    
    }
    
    delay(1000);
}

void resetState() {
    resetDriverPins();
    digitalWrite(status, LOW);
}

void getLastState() {
    if (lastState == "unkown") {
        Particle.publish("Projection_Screen_Status_Unkown", "status");
        return;
    } 

    if (lastStateEndStop == "software") {
        if (lastState == "up") {
            Particle.publish("Projection_Screen_Raised", "status");
            Particle.publish("particleFeedbackClear");
            Particle.publish("Projection_Screen_Up_Software_End_Stop_Hit", "feedback");
        } else if (lastState == "down") {
            Particle.publish("Projection_Screen_Lowered", "status");
            Particle.publish("particleFeedbackClear");
            Particle.publish("Projection_Screen_Up_Software_End_Stop_Hit", "feedback");
        }
    } else if (lastStateEndStop == "hardware") {
        if (lastState == "up") {
            Particle.publish("Projection_Screen_Raised", "status");
            Particle.publish("particleFeedbackClear");
            Particle.publish("Projection_Screen_Down_End_Stop_Hit", "feedback");
        } else if (lastState == "down") {
            Particle.publish("Projection_Screen_Lowered", "status");
            Particle.publish("particleFeedbackClear");
            Particle.publish("Projection_Screen_Down_End_Stop_Hit", "feedback");
        } 
    }
}

void checkEndstops() {
    //Read Endstops
    upEnd = analogRead(upE);
    downEnd = analogRead(downE);
    
    //Up Life complete
    if (upEnd > analogThreshold) {
        up = true;
        moving = false;
        lastState = "up";
        down = false;
        lastStateEndStop = "hardware";
        step = 0;
        Particle.publish("Projection_Screen_Raised", "status");
        Particle.publish("particleFeedbackClear");
        Particle.publish("Projection_Screen_Up_End_Stop_Hit", "feedback");
    }

    //Down Life complete
    if (downEnd > analogThreshold) {
        down = true;
        moving = false;
        lastState = "down";
        up = false;
        lastStateEndStop = "hardware";
        step = 0;
        Particle.publish("Projection_Screen_Lowered", "status");
        Particle.publish("particleFeedbackClear");
        Particle.publish("Projection_Screen_Down_End_Stop_Hit", "feedback");
    }
    
     //Do you even softwareEndstop Bro
    if (enableSoftwareEndstop) {
        //Have we made it in life
        if (step >= maxStep) {
            //Guess we have lets prepare for reincarnation
            if (direction == "raising") {
                up = true;
                lastState = "up";
                down = false;
                lastStateEndStop = "software";
                Particle.publish("Projection_Screen_Raised", "status");
                Particle.publish("particleFeedbackClear");
                Particle.publish("Projection_Screen_Up_Software_End_Stop_Hit", "feedback");
            } else if (direction == "lowering") {
                down = true;
                lastState = "down";
                up = false;
                lastStateEndStop = "software";
                Particle.publish("Projection_Screen_Lowered", "status");
                Particle.publish("particleFeedbackClear");
                Particle.publish("Projection_Screen_Down_Software_End_Stop_Hit", "feedback");
            }
            
            //Learn to step again
            step = 0;
        }
    }//Bro no like fallback, mechanical all the way
}

//Reset Stepper Motor Driver pins to default states
void resetDriverPins() {
    digitalWrite(enable, LOW); //Disabled By Default
    
    digitalWrite(stp, LOW); //Get ready to rumble

    digitalWrite(dir, LOW); //Always Raise
}

void spinMotor() {
    digitalWrite(stp,HIGH); //Trigger one step
    delay(1);
    digitalWrite(stp,LOW); //Pull step pin low so it can be triggered again
    delay(1);
    step++; //Count our steps, Bro can Dance
}

void activate(String command) {
    //Wake up
    digitalWrite(enable, HIGH);
    
    digitalWrite(status, HIGH);

    //What do we do
    if (command == "getStatus") {
        getLastState();
    } else if (command == "lower") {
        Particle.publish("Lowering_Projection_Screen", "status");
        
        direction = "lowering";

        digitalWrite(dir, LOW);
        
        //Run
        do {
            moving = true;
            spinMotor();
            checkEndstops();
        } while (down == false);
        
        particleFunctionStatus = true;

        resetState();
    }
    else if (command == "raise") {
        Particle.publish("Raising_Projection_Screen", "status");
        
        direction = "raising";

        digitalWrite(dir, HIGH);

        //Run
        do {
            moving = true;
            spinMotor();
            checkEndstops();
        } while (up == false);
        
        particleFunctionStatus = true;

        resetState();
    }
    else if (command == "stop") {
        particleFunctionStatus = true;
        
        resetState();
    }
    else {
        Particle.publish("Projection_Screen_Unkown_Command", "status");

        resetState();
    }
}

int screenToggle(String command) {
    activate(command);
    return particleFunctionStatus;
}
