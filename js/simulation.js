
/* =========================================
   ZENER-LAB-360
   FILE: simulation.js

   Educational Zener Diode Simulation Engine
========================================= */


/* ---------- Default Configuration ---------- */

export const DEFAULT_CONFIG = {

    supplyVoltage: 0,

    seriesResistance: 1000,

    loadResistance: 1000,

    zenerVoltage: 5.1,

    forwardVoltage: 0.7,

    zenerResistance: 8,

    maxCurrent: 0.05
};


/* ---------- Utility Functions ---------- */

function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );
}


function round(value, digits = 3) {

    const factor = 10 ** digits;

    return Math.round(
        value * factor
    ) / factor;
}


/* =========================================
   ZENER SIMULATION CLASS
========================================= */

export class ZenerSimulation {

    constructor(config = {}) {

        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };

        this.mode = 'forward';

        this.supplyVoltage = 0;

        this.loadResistance =
            this.config.loadResistance;

        this.seriesResistance =
            this.config.seriesResistance;

        this.zenerVoltage =
            this.config.zenerVoltage;

        this.dataPoints = [];

        this.lastResult = null;
    }


    /* =====================================
       1. UPDATE PARAMETERS
    ===================================== */

    updateParameters(parameters = {}) {

        if (
            parameters.seriesResistance !== undefined
        ) {
            this.seriesResistance = clamp(
                Number(parameters.seriesResistance),
                100,
                10000
            );
        }

        if (
            parameters.loadResistance !== undefined
        ) {
            this.loadResistance = clamp(
                Number(parameters.loadResistance),
                100,
                100000
            );
        }

        if (
            parameters.zenerVoltage !== undefined
        ) {
            this.zenerVoltage = clamp(
                Number(parameters.zenerVoltage),
                2,
                12
            );
        }

        if (
            parameters.supplyVoltage !== undefined
        ) {
            this.supplyVoltage = clamp(
                Number(parameters.supplyVoltage),
                0,
                12
            );
        }

        return this.getConfiguration();
    }


    /* =====================================
       2. SET EXPERIMENT MODE
    ===================================== */

    setMode(mode) {

        const availableModes = [
            'forward',
            'reverse',
            'load-regulation'
        ];

        if (!availableModes.includes(mode)) {

            throw new Error(
                `Invalid experiment mode: ${mode}`
            );
        }

        this.mode = mode;

        this.dataPoints = [];

        this.lastResult = null;

        return this.mode;
    }


    /* =====================================
       3. FORWARD BIAS SIMULATION
    ===================================== */

    calculateForwardBias(voltage) {

        const inputVoltage = clamp(
            Number(voltage),
            0,
            12
        );

        const vf = this.config.forwardVoltage;

        const resistance = this.seriesResistance;

        let current = 0;

        let diodeVoltage = inputVoltage;

        if (inputVoltage > vf) {

            current =
                (inputVoltage - vf) / resistance;

            current = clamp(
                current,
                0,
                this.config.maxCurrent
            );

            diodeVoltage =
                vf + current * this.config.zenerResistance;
        }

        return {

            mode: 'forward',

            supplyVoltage: round(
                inputVoltage,
                3
            ),

            diodeVoltage: round(
                diodeVoltage,
                3
            ),

            currentAmpere: round(
                current,
                6
            ),

            currentMilliampere: round(
                current * 1000,
                3
            ),

            region: current > 0
                ? 'Forward Conduction'
                : 'Cut-in Region',

            powerMilliwatt: round(
                diodeVoltage * current * 1000,
                3
            )
        };
    }


    /* =====================================
       4. REVERSE BIAS SIMULATION
    ===================================== */

    calculateReverseBias(voltage) {

        const inputVoltage = clamp(
            Number(voltage),
            0,
            12
        );

        const vz = this.zenerVoltage;

        const resistance = this.seriesResistance;

        let current = 0;

        let diodeVoltage = inputVoltage;

        let region = 'Reverse Blocking';

        if (inputVoltage >= vz) {

            current =
                (inputVoltage - vz) /
                (resistance + this.config.zenerResistance);

            current = clamp(
                current,
                0,
                this.config.maxCurrent
            );

            diodeVoltage =
                vz + current * this.config.zenerResistance;

            region = 'Zener Breakdown';
        }

        return {

            mode: 'reverse',

            supplyVoltage: round(
                inputVoltage,
                3
            ),

            diodeVoltage: round(
                diodeVoltage,
                3
            ),

            currentAmpere: round(
                current,
                6
            ),

            currentMilliampere: round(
                current * 1000,
                3
            ),

            region,

            powerMilliwatt: round(
                diodeVoltage * current * 1000,
                3
            )
        };
    }


    /* =====================================
       5. LOAD REGULATION SIMULATION
    ===================================== */

    calculateLoadRegulation(
        inputVoltage = this.supplyVoltage,
        loadResistance = this.loadResistance
    ) {

        const vin = clamp(
            Number(inputVoltage),
            0,
            12
        );

        const rl = clamp(
            Number(loadResistance),
            100,
            100000
        );

        const rs = this.seriesResistance;

        const vz = this.zenerVoltage;

        const rz = this.config.zenerResistance;

        /*
           Simplified Zener shunt regulator model.

           The source feeds a series resistor.
           The load and Zener diode are in parallel.
        */

        const totalResistance = rs + rz;

        const availableCurrent =
            Math.max(
                0,
                (vin - vz) / totalResistance
            );

        const loadCurrentAtVz =
            vz / rl;

        const zenerCurrent =
            availableCurrent - loadCurrentAtVz;

        let outputVoltage;

        let actualZenerCurrent;

        let region;

        if (zenerCurrent > 0) {

            actualZenerCurrent = zenerCurrent;

            outputVoltage =
                vz + actualZenerCurrent * rz;

            region = 'Voltage Regulation';
        }

        else {

            // Zener is not conducting.
            // Output is determined by the resistor divider.
            outputVoltage =
                vin * rl / (rs + rl);

            actualZenerCurrent = 0;

            region = 'No Zener Regulation';
        }

        const loadCurrent =
            outputVoltage / rl;

        const seriesCurrent =
            (vin - outputVoltage) / rs;

        return {

            mode: 'load-regulation',

            inputVoltage: round(vin, 3),

            outputVoltage: round(
                outputVoltage,
                3
            ),

            loadResistance: round(
                rl,
                2
            ),

            loadCurrentMilliampere: round(
                loadCurrent * 1000,
                3
            ),

            zenerCurrentMilliampere: round(
                Math.max(0, actualZenerCurrent) * 1000,
                3
            ),

            seriesCurrentMilliampere: round(
                Math.max(0, seriesCurrent) * 1000,
                3
            ),

            region,

            zenerPowerMilliwatt: round(
                outputVoltage *
                Math.max(0, actualZenerCurrent) *
                1000,
                3
            )
        };
    }


    /* =====================================
       6. RUN CURRENT EXPERIMENT
    ===================================== */

    run(voltage = this.supplyVoltage) {

        this.supplyVoltage = clamp(
            Number(voltage),
            0,
            12
        );

        let result;

        switch (this.mode) {

            case 'forward':

                result = this.calculateForwardBias(
                    this.supplyVoltage
                );

                break;

            case 'reverse':

                result = this.calculateReverseBias(
                    this.supplyVoltage
                );

                break;

            case 'load-regulation':

                result = this.calculateLoadRegulation(
                    this.supplyVoltage,
                    this.loadResistance
                );

                break;

            default:

                throw new Error(
                    'Unknown simulation mode.'
                );
        }

        this.lastResult = result;

        return result;
    }


    /* =====================================
       7. GENERATE V-I CHARACTERISTICS
    ===================================== */

    generateVIData(
        start = 0,
        end = 12,
        steps = 60
    ) {

        const points = [];

        const originalMode = this.mode;

        const stepSize =
            (end - start) / steps;

        for (let i = 0; i <= steps; i++) {

            const voltage =
                start + i * stepSize;

            let result;

            if (originalMode === 'forward') {

                result = this.calculateForwardBias(
                    voltage
                );
            }

            else {

                result = this.calculateReverseBias(
                    voltage
                );
            }

            points.push({

                voltage: result.diodeVoltage,

                current: result.currentMilliampere,

                supplyVoltage: voltage,

                region: result.region

            });
        }

        this.dataPoints = points;

        return points;
    }


    /* =====================================
       8. GENERATE LOAD REGULATION DATA
    ===================================== */

    generateLoadData(
        minResistance = 500,
        maxResistance = 10000,
        steps = 30
    ) {

        const points = [];

        const stepSize =
            (maxResistance - minResistance) / steps;

        for (let i = 0; i <= steps; i++) {

            const resistance =
                minResistance + i * stepSize;

            const result =
                this.calculateLoadRegulation(
                    this.supplyVoltage,
                    resistance
                );

            points.push({

                resistance: round(
                    resistance,
                    2
                ),

                outputVoltage:
                    result.outputVoltage,

                loadCurrent:
                    result.loadCurrentMilliampere,

                zenerCurrent:
                    result.zenerCurrentMilliampere,

                region: result.region
            });
        }

        this.dataPoints = points;

        return points;
    }


    /* =====================================
       9. RECORD OBSERVATION
    ===================================== */

    recordObservation() {

        if (!this.lastResult) {
            return null;
        }

        return {
            ...this.lastResult,
            timestamp: new Date().toISOString()
        };
    }


    /* =====================================
       10. RESET SIMULATION
    ===================================== */

    reset() {

        this.supplyVoltage = 0;

        this.dataPoints = [];

        this.lastResult = null;

        this.loadResistance =
            this.config.loadResistance;

        return this.run(0);
    }


    /* =====================================
       11. GET CONFIGURATION
    ===================================== */

    getConfiguration() {

        return {

            mode: this.mode,

            supplyVoltage:
                this.supplyVoltage,

            seriesResistance:
                this.seriesResistance,

            loadResistance:
                this.loadResistance,

            zenerVoltage:
                this.zenerVoltage,

            forwardVoltage:
                this.config.forwardVoltage
        };
    }


    /* =====================================
       12. SAFETY CHECK
    ===================================== */

    checkOperatingLimits(result) {

        const warnings = [];

        if (
            result.powerMilliwatt !== undefined &&
            result.powerMilliwatt > 250
        ) {
            warnings.push(
                'Diode power exceeds the example 250 mW limit.'
            );
        }

        if (
            result.zenerPowerMilliwatt !== undefined &&
            result.zenerPowerMilliwatt > 250
        ) {
            warnings.push(
                'Zener power exceeds the example 250 mW limit.'
            );
        }

        if (
            result.currentMilliampere !== undefined &&
            result.currentMilliampere > 20
        ) {
            warnings.push(
                'Current exceeds the example 20 mA operating limit.'
            );
        }

        return {

            safe: warnings.length === 0,

            warnings
        };
    }
}


/* =========================================
   FACTORY FUNCTION
========================================= */

export function createSimulation(config = {}) {

    return new ZenerSimulation(config);
}


/* =========================================
   DEFAULT INSTANCE
========================================= */

export const simulation =
    new ZenerSimulation();


export default ZenerSimulation;

