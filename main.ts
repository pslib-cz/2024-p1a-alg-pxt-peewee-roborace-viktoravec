let ready: boolean = false;
let parkSensor: boolean = false;
let normalMode: boolean = true;
let autoMode: boolean = false;
let autoSong: boolean = true;
let lastAutoDrive: number = 0;

radio.on();
radio.setFrequencyBand(50);
radio.setGroup(128);

radio.onReceivedString(function (receivedString: string) {
    if (receivedString == "start") {
        ready = true
        return;
    };

    let parts = receivedString.split(",")

    if (parts.length == 5) {
        let autoDrive = parseFloat(parts[4]);

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
            let naklonX = parseFloat(parts[0]);
            let naklonY = parseFloat(parts[1]);
            let horn = parseFloat(parts[2]);
            let park = parseFloat(parts[3]);

            naklonX = Math.constrain(naklonX, -1023, 1023);
            naklonY = Math.constrain(naklonY, -1023, 1023);
            let speed = Math.map(naklonX, -1023, 1023, -256, 256);
            let turn = Math.map(naklonY, -1023, 1023, -256, 256);

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
    };
});

type IRC = {
    l: DigitalPin,
    c: DigitalPin,
    r: DigitalPin
}

const IR: IRC = {
    l: DigitalPin.P14,
    c: DigitalPin.P15,
    r: DigitalPin.P13
}

pins.setPull(IR.l, PinPullMode.PullNone);
pins.setPull(IR.c, PinPullMode.PullNone);
pins.setPull(IR.r, PinPullMode.PullNone);

basic.forever(function () {
    if (autoMode) {
        let dataL: number;
        let dataC: number;
        let dataR: number;

        dataL = pins.digitalReadPin(IR.l);
        dataC = pins.digitalReadPin(IR.c);
        dataR = pins.digitalReadPin(IR.r);

        if (dataL == 1 && dataC == 0 && dataR == 1) {
            PCAmotor.MotorRun(PCAmotor.Motors.M1, 200)
            PCAmotor.MotorRun(PCAmotor.Motors.M4, -200)
        }
        else if (dataL == 0 && dataC == 0 && dataR == 1) {
            PCAmotor.MotorRun(PCAmotor.Motors.M1, 75)
            PCAmotor.MotorRun(PCAmotor.Motors.M4, -200)
        }
        else if (dataL == 1 && dataC == 0 && dataR == 0) {
            PCAmotor.MotorRun(PCAmotor.Motors.M1, 200)
            PCAmotor.MotorRun(PCAmotor.Motors.M4, -75)
        }
        else {
            PCAmotor.MotorStopAll()
        }
        basic.pause(20)
    }

    if (parkSensor) {
        let distance = Sensors.ping(DigitalPin.P2, DigitalPin.P1, 500)
        basic.pause(30);

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
