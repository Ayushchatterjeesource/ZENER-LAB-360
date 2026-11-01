
/* =====================================================
   ZENER-LAB-360
   FILE: js/simulation.js

   Educational Zener Diode Simulation
   Modes:
   1. Forward Bias
   2. Reverse Bias
   3. Load Regulation

   Simplified educational model.
   Not a replacement for physical lab measurements.
===================================================== */

export class ZenerSimulation {

    constructor(options = {}) {

        this.parameters = {

            seriesResistance: 1000,

            loadResistance: 1000,

            zenerVoltage: 5.1,

            forwardVoltage: 0.7,

            zenerResistance: 8,

            maxCurrent: 0.02,

            ...options

        };

        this.mode = 'forward';

        this.observations = [];

        this.lastResult = null;

        this.maxSupplyVoltage = 12;
    }


    /* ================================================
       1. SET EXPERIMENT MODE
    ================================================ */

    setMode(mode) {

        const validModes = [
            'forward',
            'reverse',
            'load-regulation'
        ];

        if (!validModes.includes(mode)) {

            console.warn(
                'Unknown experiment mode:',
                mode
            );

            return;
        }

        this.mode = mode;

        this.lastResult = null;

        this.observations = [];
    }


    /* ================================================
       2. UPDATE PARAMETERS
    ================================================ */

    updateParameters(parameters = {}) {

        for (const [key, value] of
            Object.entries(parameters)) {

            if (
                key in this.parameters &&
                Number.isFinite(Number(value))
            ) {

                this.parameters[key] = Number(value);
            }
        }

        this.parameters.seriesResistance =
            Math.max(
                1,
                this.parameters.seriesResistance
            );

        this.parameters.loadResistance =
            Math.max(
                1,
                this.parameters.loadResistance
            );

        this.parameters.maxCurrent =
            Math.max(
                0.001,
                this.parameters.maxCurrent
            );

        return this.parameters;
    }


    /* ================================================
       3. MAIN RUN FUNCTION
    ================================================ */

    run(inputVoltage = 0) {

        const voltage = Math.max(
            0,
            Math.min(
                Number(inputVoltage) || 0,
                this.maxSupplyVoltage
            )
        );

        let result;

        switch (this.mode) {

            case 'forward':

                result =
                    this.calculateForwardBias(voltage);

                break;


            case 'reverse':

                result =
                    this.calculateReverseBias(voltage);

                break;


            case 'load-regulation':

                result =
                    this.calculateLoadRegulation(voltage);

                break;


            default:

                result =
                    this.calculateForwardBias(voltage);
        }

        this.lastResult = result;

        return result;
    }


    /* ================================================
       4. FORWARD BIAS
    ================================================ */

    calculateForwardBias(inputVoltage) {

        const R =
            this.parameters.seriesResistance;

        const Vf =
            this.parameters.forwardVoltage;

        const maxCurrent =
            this.parameters.maxCurrent;

        let current = 0;

        let diodeVoltage = 0;

        if (inputVoltage > Vf) {

            current =
                (inputVoltage - Vf) / R;

            current = Math.min(
                current,
                maxCurrent
            );

            diodeVoltage =
                Vf + current * 5;
        }

        const power =
            diodeVoltage * current;

        return {

            mode: 'forward',

            inputVoltage,

            diodeVoltage,

            currentAmpere: current,

            currentMilliampere:
                current * 1000,

            powerWatt: power,

            powerMilliwatt:
                power * 1000,

            region:
                current > 0
                    ? 'Forward Conduction'
                    : 'Cut-off',

            message:
                current > 0
                    ? 'Diode is conducting in forward bias.'
                    : 'Forward voltage is below the conduction threshold.'
        };
    }


    /* ================================================
       5. REVERSE BIAS
    ================================================ */

    calculateReverseBias(inputVoltage) {

        const R =
            this.parameters.seriesResistance;

        const Vz =
            this.parameters.zenerVoltage;

        const rz =
            this.parameters.zenerResistance;

        const maxCurrent =
            this.parameters.maxCurrent;

        let current = 0;

        let diodeVoltage = inputVoltage;

        let region = 'Reverse Blocking';

        if (inputVoltage >= Vz) {

            current =
                (inputVoltage - Vz) /
                (R + rz);

            current = Math.min(
                current,
                maxCurrent
            );

            diodeVoltage =
                Vz + current * rz;

            region =
                'Zener Breakdown';
        }

        const power =
            diodeVoltage * current;

        return {

            mode: 'reverse',

            inputVoltage,

            diodeVoltage,

            currentAmpere: current,

            currentMilliampere:
                current * 1000,

            powerWatt: power,

            powerMilliwatt:
                power * 1000,

            region,

            message:
                region === 'Zener Breakdown'
                    ? 'Zener breakdown region reached in the educational model.'
                    : 'Diode is in reverse blocking region.'
        };
    }


    /* ================================================
       6. LOAD REGULATION
    ================================================ */

    calculateLoadRegulation(inputVoltage) {

        const Rs =
            this.parameters.seriesResistance;

        const RL =
            this.parameters.loadResistance;

        const Vz =
            this.parameters.zenerVoltage;

        const rz =
            this.parameters.zenerResistance;

        const maxCurrent =
            this.parameters.maxCurrent;

        const availableCurrent =
            Math.max(
                0,
                (inputVoltage - Vz) / Rs
            );

        const loadCurrentAtVz =
            Vz / RL;

        let zenerCurrent = 0;

        let outputVoltage = 0;

        let status = 'Unregulated';

        if (inputVoltage <= 0) {

            outputVoltage = 0;

        }

        else if (availableCurrent >
            loadCurrentAtVz) {

            zenerCurrent =
                Math.min(
                    availableCurrent -
                    loadCurrentAtVz,
                    maxCurrent
                );

            outputVoltage =
                Vz + zenerCurrent * rz;

            outputVoltage = Math.min(
                outputVoltage,
                inputVoltage
            );

            status = 'Zener Regulating';

        }

        else {

            /*
              Simplified no-breakdown load condition:
              The Zener is treated as non-conducting.
              Output is determined by the series/load divider.
            */

            outputVoltage =
                inputVoltage *
                RL / (Rs + RL);

            zenerCurrent = 0;

            status = 'Unregulated';
        }


        const loadCurrent =
            outputVoltage / RL;

        const zenerPower =
            outputVoltage * zenerCurrent;

        const loadPower =
            outputVoltage * loadCurrent;

        return {

            mode: 'load-regulation',

            inputVoltage,

            outputVoltage,

            currentMilliampere:
                loadCurrent * 1000,

            loadCurrentAmpere:
                loadCurrent,

            loadCurrentMilliampere:
                loadCurrent * 1000,

            zenerCurrentAmpere:
                zenerCurrent,

            zenerCurrentMilliampere:
                zenerCurrent * 1000,

            zenerPowerWatt:
                zenerPower,

            zenerPowerMilliwatt:
                zenerPower * 1000,

            powerWatt:
                loadPower,

            powerMilliwatt:
                loadPower * 1000,

            region: status,

            regulationStatus: status,

            message:
                status === 'Zener Regulating'
                    ? 'Zener diode is regulating the output in the simplified model.'
                    : 'Output is not maintained at the nominal Zener voltage.'
        };
    }


    /* ================================================
       7. RECORD OBSERVATION
    ================================================ */

    recordObservation() {

        if (!this.lastResult) {

            return null;
        }

        const observation = {

            ...this.lastResult,

            observationNumber:
                this.observations.length + 1,

            recordedAt:
                new Date().toLocaleTimeString()

        };

        this.observations.push(observation);

        return observation;
    }


    /* ================================================
       8. GENERATE V-I DATA
    ================================================ */

    generateVIData(
        startVoltage = 0,
        endVoltage = 12,
        steps = 60
    ) {

        const originalMode = this.mode;

        const data = [];

        this.mode =
            originalMode === 'reverse'
                ? 'reverse'
                : 'forward';

        const count = Math.max(
            2,
            Math.floor(steps)
        );

        for (let i = 0; i <= count; i++) {

            const voltage =
                startVoltage +
                (endVoltage - startVoltage) *
                i / count;

            const result =
                this.mode === 'reverse'
                    ? this.calculateReverseBias(voltage)
                    : this.calculateForwardBias(voltage);

            data.push({

                voltage: result.inputVoltage,

                diodeVoltage:
                    result.diodeVoltage,

                current:
                    result.currentMilliampere,

                currentMilliampere:
                    result.currentMilliampere,

                power:
                    result.powerMilliwatt,

                region:
                    result.region

            });
        }

        this.mode = originalMode;

        return data;
    }


    /* ================================================
       9. GENERATE LOAD DATA
    ================================================ */

    generateLoadData() {

        const originalResistance =
            this.parameters.loadResistance;

        const originalMode =
            this.mode;

        const data = [];

        this.mode = 'load-regulation';

        const resistanceValues = [
            470,
            680,
            1000,
            1500,
            2200,
            3300,
            4700,
            6800,
            10000
        ];

        for (const resistance of resistanceValues) {

            this.parameters.loadResistance =
                resistance;

            const result =
                this.calculateLoadRegulation(
                    this.lastResult?.inputVoltage ?? 10
                );

            data.push({

                loadResistance: resistance,

                resistance,

                outputVoltage:
                    result.outputVoltage,

                voltage:
                    result.outputVoltage,

                loadCurrent:
                    result.loadCurrentMilliampere,

                current:
                    result.loadCurrentMilliampere,

                zenerCurrent:
                    result.zenerCurrentMilliampere,

                status:
                    result.regulationStatus

            });
        }

        this.parameters.loadResistance =
            originalResistance;

        this.mode = originalMode;

        return data;
    }


    /* ================================================
       10. REGULATION CALCULATION
    ================================================ */

    calculateRegulation(
        noLoadVoltage,
        fullLoadVoltage
    ) {

        if (
            !Number.isFinite(noLoadVoltage) ||
            !Number.isFinite(fullLoadVoltage) ||
            fullLoadVoltage <= 0
        ) {
            return null;
        }

        return (
            (noLoadVoltage - fullLoadVoltage) /
            fullLoadVoltage
        ) * 100;
    }


    /* ================================================
       11. RESET
    ================================================ */

    reset() {

        this.observations = [];

        this.lastResult = null;

        return true;
    }


    /* ================================================
       12. GETTERS
    ================================================ */

    getParameters() {

        return {
            ...this.parameters
        };
    }


    getObservations() {

        return [
            ...this.observations
        ];
    }


    getLastResult() {

        return this.lastResult;
    }

}
