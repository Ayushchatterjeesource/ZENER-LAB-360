
/* =========================================
   ZENER-LAB-360
   FILE: graph.js

   V-I Characteristics & Load Regulation
   Canvas Graph Engine
========================================= */

export class ExperimentGraph {

    constructor(canvas, options = {}) {

        if (typeof canvas === 'string') {
            canvas = document.querySelector(canvas);
        }

        if (!canvas) {
            throw new Error(
                'Graph canvas element not found.'
            );
        }

        this.canvas = canvas;

        this.ctx = canvas.getContext('2d');

        this.options = {

            background: '#101b2b',

            gridColor: 'rgba(148, 163, 184, 0.13)',

            axisColor: '#94a3b8',

            textColor: '#cbd5e1',

            lineColor: '#22d3ee',

            pointColor: '#facc15',

            padding: {
                top: 35,
                right: 25,
                bottom: 55,
                left: 65
            },

            ...options
        };

        this.data = [];

        this.graphType = 'vi';

        this.labels = {
            x: 'Diode Voltage (V)',
            y: 'Current (mA)'
        };

        this.resizeObserver = null;

        this.setupResizeObserver();

        this.resize();
    }


    /* =====================================
       1. RESIZE CANVAS
    ===================================== */

    resize() {

        const rect =
            this.canvas.getBoundingClientRect();

        const width = Math.max(
            300,
            rect.width || 600
        );

        const height = Math.max(
            220,
            rect.height || 320
        );

        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        this.canvas.width =
            Math.round(width * pixelRatio);

        this.canvas.height =
            Math.round(height * pixelRatio);

        this.ctx.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );

        this.width = width;

        this.height = height;

        if (this.data.length) {
            this.draw();
        }
    }


    /* =====================================
       2. OBSERVE CANVAS SIZE
    ===================================== */

    setupResizeObserver() {

        if (!window.ResizeObserver) {
            return;
        }

        this.resizeObserver =
            new ResizeObserver(() => {
                this.resize();
            });

        this.resizeObserver.observe(
            this.canvas
        );
    }


    /* =====================================
       3. SET GRAPH TYPE
    ===================================== */

    setGraphType(type) {

        const supported = [
            'vi',
            'load'
        ];

        if (!supported.includes(type)) {
            throw new Error(
                `Unsupported graph type: ${type}`
            );
        }

        this.graphType = type;

        if (type === 'vi') {

            this.labels = {
                x: 'Diode Voltage (V)',
                y: 'Current (mA)'
            };
        }

        else {

            this.labels = {
                x: 'Load Resistance (Ω)',
                y: 'Output Voltage (V)'
            };
        }

        return this;
    }


    /* =====================================
       4. SET GRAPH DATA
    ===================================== */

    setData(data = []) {

        if (!Array.isArray(data)) {
            throw new Error(
                'Graph data must be an array.'
            );
        }

        this.data = data.filter(point => {

            const x = this.graphType === 'vi'
                ? point.voltage
                : point.resistance;

            const y = this.graphType === 'vi'
                ? point.current
                : point.outputVoltage;

            return (
                Number.isFinite(Number(x)) &&
                Number.isFinite(Number(y))
            );
        });

        this.draw();

        return this;
    }


    /* =====================================
       5. CALCULATE DATA RANGE
    ===================================== */

    getDataRange() {

        if (!this.data.length) {

            return {
                minX: 0,
                maxX: 12,
                minY: 0,
                maxY: 20
            };
        }

        const xValues = this.data.map(point => {

            return Number(
                this.graphType === 'vi'
                    ? point.voltage
                    : point.resistance
            );

        });

        const yValues = this.data.map(point => {

            return Number(
                this.graphType === 'vi'
                    ? point.current
                    : point.outputVoltage
            );

        });

        const minX = Math.min(0, ...xValues);

        const maxX = Math.max(...xValues);

        const minY = Math.min(0, ...yValues);

        const maxY = Math.max(...yValues);

        return {

            minX,

            maxX: maxX === minX
                ? maxX + 1
                : maxX * 1.1,

            minY,

            maxY: maxY === minY
                ? maxY + 1
                : maxY * 1.1
        };
    }


    /* =====================================
       6. DRAW BACKGROUND
    ===================================== */

    drawBackground() {

        const ctx = this.ctx;

        ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );

        ctx.fillStyle =
            this.options.background;

        ctx.fillRect(
            0,
            0,
            this.width,
            this.height
        );
    }


    /* =====================================
       7. DRAW GRID
    ===================================== */

    drawGrid(range, plot) {

        const ctx = this.ctx;

        const divisions = 6;

        ctx.strokeStyle =
            this.options.gridColor;

        ctx.lineWidth = 1;

        ctx.fillStyle =
            this.options.textColor;

        ctx.font = '11px Arial';

        for (let i = 0; i <= divisions; i++) {

            const x =
                plot.left +
                (plot.width / divisions) * i;

            const y =
                plot.top +
                (plot.height / divisions) * i;

            // Vertical grid
            ctx.beginPath();

            ctx.moveTo(x, plot.top);

            ctx.lineTo(
                x,
                plot.top + plot.height
            );

            ctx.stroke();

            // Horizontal grid
            ctx.beginPath();

            ctx.moveTo(plot.left, y);

            ctx.lineTo(
                plot.left + plot.width,
                y
            );

            ctx.stroke();

            const xValue =
                range.minX +
                ((range.maxX - range.minX) / divisions) * i;

            const yValue =
                range.maxY -
                ((range.maxY - range.minY) / divisions) * i;

            ctx.textAlign = 'center';

            ctx.fillText(
                xValue.toFixed(1),
                x,
                plot.top + plot.height + 19
            );

            ctx.textAlign = 'right';

            ctx.fillText(
                yValue.toFixed(1),
                plot.left - 9,
                y + 4
            );
        }
    }


    /* =====================================
       8. DRAW AXES
    ===================================== */

    drawAxes(plot) {

        const ctx = this.ctx;

        ctx.strokeStyle =
            this.options.axisColor;

        ctx.lineWidth = 1.5;

        ctx.beginPath();

        ctx.moveTo(
            plot.left,
            plot.top
        );

        ctx.lineTo(
            plot.left,
            plot.top + plot.height
        );

        ctx.lineTo(
            plot.left + plot.width,
            plot.top + plot.height
        );

        ctx.stroke();


        // X-axis label
        ctx.fillStyle =
            this.options.textColor;

        ctx.font = '12px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(
            this.labels.x,
            plot.left + plot.width / 2,
            this.height - 10
        );


        // Y-axis label
        ctx.save();

        ctx.translate(
            15,
            plot.top + plot.height / 2
        );

        ctx.rotate(-Math.PI / 2);

        ctx.fillText(
            this.labels.y,
            0,
            0
        );

        ctx.restore();
    }


    /* =====================================
       9. CONVERT DATA TO CANVAS POSITION
    ===================================== */

    mapPoint(x, y, range, plot) {

        const canvasX =
            plot.left +
            ((x - range.minX) /
                (range.maxX - range.minX)) *
            plot.width;

        const canvasY =
            plot.top +
            plot.height -
            ((y - range.minY) /
                (range.maxY - range.minY)) *
            plot.height;

        return {
            x: canvasX,
            y: canvasY
        };
    }


    /* =====================================
       10. DRAW DATA LINE
    ===================================== */

    drawLine(range, plot) {

        if (this.data.length < 2) {
            return;
        }

        const ctx = this.ctx;

        ctx.beginPath();

        this.data.forEach((point, index) => {

            const x = this.graphType === 'vi'
                ? Number(point.voltage)
                : Number(point.resistance);

            const y = this.graphType === 'vi'
                ? Number(point.current)
                : Number(point.outputVoltage);

            const mapped = this.mapPoint(
                x,
                y,
                range,
                plot
            );

            if (index === 0) {
                ctx.moveTo(
                    mapped.x,
                    mapped.y
                );
            }

            else {
                ctx.lineTo(
                    mapped.x,
                    mapped.y
                );
            }
        });

        ctx.strokeStyle =
            this.options.lineColor;

        ctx.lineWidth = 2.5;

        ctx.lineJoin = 'round';

        ctx.lineCap = 'round';

        ctx.stroke();
    }


    /* =====================================
       11. DRAW DATA POINTS
    ===================================== */

    drawPoints(range, plot) {

        const ctx = this.ctx;

        this.data.forEach(point => {

            const x = this.graphType === 'vi'
                ? Number(point.voltage)
                : Number(point.resistance);

            const y = this.graphType === 'vi'
                ? Number(point.current)
                : Number(point.outputVoltage);

            const mapped = this.mapPoint(
                x,
                y,
                range,
                plot
            );

            ctx.beginPath();

            ctx.arc(
                mapped.x,
                mapped.y,
                3,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                this.options.pointColor;

            ctx.fill();
        });
    }


    /* =====================================
       12. DRAW EMPTY STATE
    ===================================== */

    drawEmptyState() {

        const ctx = this.ctx;

        ctx.fillStyle =
            this.options.textColor;

        ctx.font = '14px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(
            'Run the experiment to generate graph data.',
            this.width / 2,
            this.height / 2
        );
    }


    /* =====================================
       13. DRAW COMPLETE GRAPH
    ===================================== */

    draw() {

        if (!this.ctx) {
            return;
        }

        this.drawBackground();

        if (!this.width || !this.height) {
            return;
        }

        if (!this.data.length) {

            this.drawEmptyState();

            return;
        }

        const padding =
            this.options.padding;

        const plot = {

            left: padding.left,

            top: padding.top,

            width:
                this.width -
                padding.left -
                padding.right,

            height:
                this.height -
                padding.top -
                padding.bottom
        };

        if (
            plot.width <= 0 ||
            plot.height <= 0
        ) {
            return;
        }

        const range = this.getDataRange();

        this.drawGrid(
            range,
            plot
        );

        this.drawAxes(plot);

        this.drawLine(
            range,
            plot
        );

        this.drawPoints(
            range,
            plot
        );
    }


    /* =====================================
       14. CLEAR GRAPH
    ===================================== */

    clear() {

        this.data = [];

        this.draw();
    }


    /* =====================================
       15. DESTROY GRAPH
    ===================================== */

    destroy() {

        if (this.resizeObserver) {

            this.resizeObserver.disconnect();

            this.resizeObserver = null;
        }

        this.clear();
    }
}


/* =========================================
   FACTORY FUNCTION
========================================= */

export function createGraph(
    canvas,
    options = {}
) {

    return new ExperimentGraph(
        canvas,
        options
    );
}


export default ExperimentGraph;

