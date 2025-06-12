let ready: boolean = false;
let parkSensor: boolean = false;
let normalMode: boolean = true;
let autoMode: boolean = false;
let autoSong: boolean = true;
let lastAutoDrive: number = 0;
let lastTilt: number = 0
let turning: boolean = false;

radio.on();
radio.setFrequencyBand(50);
radio.setGroup(128);

radio.onReceivedString(function (receivedString: string) {
    let parts = receivedString.split(",")

    if (receivedString == "start") {
        ready = true
        return;
    };

    if (parts.length === 5) {
        let autoDrive = parseFloat(parts[4]);
        let naklonX = parseFloat(parts[0]);
        let naklonY = parseFloat(parts[1]);

        naklonX = Math.constrain(naklonX, -1023, 1023);
        naklonY = Math.constrain(naklonY, -1023, 1023);

        let speed = Math.map(naklonX, -1023, 1023, -256, 256);
        let turn = Math.map(naklonY, -1023, 1023, -256, 256);
        lastTilt = speed;

        if (autoDrive == 1 && lastAutoDrive == 0) {
            if (autoSong == true) {
                basic.showString("A", 0);
                music.playTone(400, 200);
                basic.pause(50);
                music.playTone(600, 200);
                basic.pause(50);
                music.playTone(800, 200);
                basic.pause(50);
                music.playTone(1000, 200);
                basic.pause(50);
                music.playTone(1200, 200);
                basic.pause(100);
                basic.clearScreen()
            }
            else {
                basic.showString("M", 0);
                music.playTone(700, 200);
                basic.pause(100);
                music.playTone(500, 200);
                basic.pause(100);
                music.playTone(300, 600);
                basic.pause(100);
                basic.clearScreen()
            }

            autoSong = !autoSong;
            autoMode = !autoMode;
            normalMode = !normalMode;
        }

        lastAutoDrive = autoDrive;

        if (ready && normalMode) {
            let horn = parseFloat(parts[2]);
            let park = parseFloat(parts[3]);

            let leftMotorSpeed = speed - turn;
            let rightMotorSpeed = speed + turn;

            leftMotorSpeed = Math.constrain(leftMotorSpeed, -256, 256);
            rightMotorSpeed = Math.constrain(rightMotorSpeed, -256, 256);

            if (Math.abs(naklonX) > 50 || Math.abs(naklonY) > 50) {
                PCAmotor.MotorRun(PCAmotor.Motors.M1, leftMotorSpeed + 10);
                PCAmotor.MotorRun(PCAmotor.Motors.M4, rightMotorSpeed + 10);
            }
            else {
                PCAmotor.MotorStopAll()
            };

            if (horn == 1) {
                basic.showLeds(`
            # . . . #
            . # . # .
            . . # . .
            . # . # .
            # . . . #
            `);
                music.playTone(500, 150)
                basic.pause(100)
                music.playTone(500, 650)
                basic.pause(100)
                basic.clearScreen()
            };

            if (park == 1) {
                parkSensor = !parkSensor

                if (parkSensor) {
                    PCAmotor.Servo(PCAmotor.Servos.S1, 150);
                    basic.pause(500);
                    PCAmotor.Servo(PCAmotor.Servos.S1, 200);
                    basic.pause(500);
                    PCAmotor.Servo(PCAmotor.Servos.S1, 100);
                    basic.pause(500);
                    PCAmotor.Servo(PCAmotor.Servos.S1, 150);
                };
            };
        };
    }else{
        PCAmotor.MotorStopAll();
        basic.showString("!", 0);
        music.playTone(1000, 0)
    };
});

type IRC = {
    l: DigitalPin,
    c: DigitalPin,
    r: DigitalPin
};

const IR: IRC = {
    l: DigitalPin.P14,
    c: DigitalPin.P15,
    r: DigitalPin.P13
};

pins.setPull(IR.l, PinPullMode.PullNone);
pins.setPull(IR.c, PinPullMode.PullNone);
pins.setPull(IR.r, PinPullMode.PullNone);

function drive(left: number, right: number) {
    PCAmotor.MotorRun(PCAmotor.Motors.M1, left);
    PCAmotor.MotorRun(PCAmotor.Motors.M4, right)
};

basic.forever(function () {
    if (autoMode) {

        console.log(lastTilt);
        let dataL: number = pins.digitalReadPin(IR.l);
        let dataC: number = pins.digitalReadPin(IR.c);
        let dataR: number = pins.digitalReadPin(IR.r);
        
        
        

        let allDir: boolean = false;
        if (dataL == 1 && dataC == 1 && dataR == 1){
            allDir = true;
        }else{
            allDir = false;
        };

//Normální trasa
        if (dataL == 0 && dataC == 1 && dataR == 0) {
            drive(80, -120);
        }
        else if (dataL == 1 && dataC == 0 && dataR == 0) {
            drive(0, -80);
        }
        else if (dataL == 1 && dataC == 1 && dataR == 0) {
            drive(40, -80);
        }
        else if (dataL == 0 && dataC == 0 && dataR == 1) {
            drive(80, 0);
        } 
        else if (dataL == 0 && dataC == 1 && dataR == 1) {
            drive(80, -40);
        } else if (dataL == 0 && dataC == 0 && dataR == 0){
            drive(80, -120);
        }else {
            PCAmotor.MotorStopAll();
        };

//Křižovatka
        if (!turning && allDir && lastTilt < -50) {
            turning = true;
            drive(-100, -150);
            basic.pause(500);
            turning = false
        } 
         else if (!turning && allDir && lastTilt > 50){
             turning = true
            drive(150, 100);
            basic.pause(500);
            turning = false
        }
         else if (!turning && allDir){
            drive(80, -120)
        };
        basic.pause(5);
    };

    if (parkSensor) {
        let distance = Sensors.ping(DigitalPin.P2, DigitalPin.P1, 500)
        basic.pause(10);

        if (distance <= 40 && distance > 35) {
            music.playTone(400, 250);
            basic.pause(800);
        } else if (distance <= 35 && distance > 30) {
            music.playTone(400, 250);
            basic.pause(500);
        } else if (distance <= 30 && distance > 25) {
            music.playTone(400, 250);
            basic.pause(400);
        } else if (distance <= 25 && distance > 20) {
            music.playTone(400, 250);
            basic.pause(300)
        } else if (distance <= 20 && distance > 15) {
            music.playTone(400, 250);
            basic.pause(200);
        } else if (distance <= 15 && distance > 7) {
            music.playTone(400, 250);
            basic.pause(100);
        } else if (distance <= 7) {
            music.playTone(400, 1000);
        };
    };
});

