
/* =====================================================
   ZENER-LAB-360
   FILE: js/graph.js

   Interactive Experiment Graph
   Forward Bias | Reverse Bias | Load Regulation
===================================================== */

export class ExperimentGraph {

    constructor(canvas) {

        this.canvas = canvas;

        if (!this.canvas) {
            throw new Error('Graph canvas not found.');
        }

        this.ctx = this.canvas.getContext('2d');

        this.graphType = 'vi';

        this.data = [];

        this.resizeObserver = null;

        this.init();
    }


    /* ================================================
       INITIALIZE
    ================================================ */

    init() {

        this.resizeCanvas();

        if (typeof ResizeObserver !== 'undefined') {

            this.resizeObserver =
                new ResizeObserver(() => {
                    this.resizeCanvas();
                });

            this.resizeObserver.observe(this.canvas);
        }

        this.draw();
    }


    /* ================================================
       RESIZE CANVAS
    ================================================ */

    resizeCanvas() {

        const rect =
            this.canvas.getBoundingClientRect();

        const width =
            Math.max(300, rect.width);

        const height =
            Math.max(220, rect.height || 300);

        const dpr =
            Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width =
            Math.round(width * dpr);

        this.canvas.height =
            Math.round(height * dpr);

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        this.width = width;

        this.height = height;

        this.draw();
    }


    /* ================================================
       SET GRAPH TYPE
    ================================================ */

    setGraphType(type) {

        this.graphType = type;

        this.draw();

        return this;
    }


    /* ================================================
       SET DATA
    ================================================ */

    setData(data = []) {

        this.data =
            Array.isArray(data) ? data : [];

        this.draw();

        return this;
    }


    /* ================================================
       CLEAR GRAPH
    ================================================ */

    clear() {

        this.data = [];

        this.draw();

        return this;
    }


    /* ================================================
       MAIN DRAW
    ================================================ */

    draw() {

        if (!this.ctx || !this.width) {
            return;
        }

        const ctx = this.ctx;

        const width = this.width;

        const height = this.height;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#101827';

        ctx.fillRect(0, 0, width, height);

        const margin = {

            top: 35,

            right: 24,

            bottom: 58,

            left: 65

        };

        const plot = {

            x: margin.left,

            y: margin.top,

            width:
                width - margin.left - margin.right,

            height:
                height - margin.top - margin.bottom

        };

        this.drawTitle(ctx, width);

        if (!this.data.length) {

            this.drawEmptyMessage(
                ctx,
                plot
            );

            return;
        }

        const values =
            this.getGraphValues();

        this.drawGrid(
            ctx,
            plot,
            values
        );

        this.drawAxes(
            ctx,
            plot,
            values
        );

        this.drawData(
            ctx,
            plot,
            values
        );

        this.drawAxisLabels(
            ctx,
            plot
        );
    }


    /* ================================================
       GRAPH VALUES
    ================================================ */

    getGraphValues() {

        const isLoad =
            this.graphType === 'load';

        const xValues =
            this.data.map(item => {

                return Number(
                    isLoad
                        ? item.loadResistance ?? item.resistance
                        : item.voltage ?? item.inputVoltage ?? 0
                );

            });

        const yValues =
            this.data.map(item => {

                return Number(
                    isLoad
                        ? item.outputVoltage ?? item.voltage
                        : item.currentMilliampere ?? item.current ?? 0
                );

            });

        const minX = Math.min(...xValues);

        const maxX = Math.max(...xValues);

        const minY = Math.min(0, ...yValues);

        const maxY = Math.max(...yValues);

        return {

            minX,

            maxX: maxX === minX ? minX + 1 : maxX,

            minY,

            maxY: maxY === minY ? minY + 1 : maxY * 1.12

        };
    }


    /* ================================================
       TITLE
    ================================================ */

    drawTitle(ctx, width) {

        ctx.save();

        ctx.fillStyle = '#e5f3ff';

        ctx.font = '600 14px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(

            this.graphType === 'load'
                ? 'LOAD REGULATION CHARACTERISTICS'
                : 'ZENER DIODE V-I CHARACTERISTICS',

            width / 2,

            19

        );

        ctx.restore();
    }


    /* ================================================
       GRID
    ================================================ */

    drawGrid(ctx, plot, values) {

        ctx.save();

        ctx.strokeStyle = '#26364b';

        ctx.lineWidth = 1;

        ctx.fillStyle = '#a7b7cb';

        ctx.font = '11px Arial';

        const divisions = 5;

        for (let i = 0; i <= divisions; i++) {

            const x =
                plot.x +
                (plot.width / divisions) * i;

            const y =
                plot.y +
                (plot.height / divisions) * i;

            ctx.beginPath();

            ctx.moveTo(x, plot.y);

            ctx.lineTo(x, plot.y + plot.height);

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(plot.x, y);

            ctx.lineTo(plot.x + plot.width, y);

            ctx.stroke();


            const xValue =
                values.minX +
                (values.maxX - values.minX) *
                i / divisions;

            const yValue =
                values.maxY -
                (values.maxY - values.minY) *
                i / divisions;

            ctx.textAlign = 'center';

            ctx.fillText(
                this.formatNumber(xValue),
                x,
                plot.y + plot.height + 17
            );

            ctx.textAlign = 'right';

            ctx.fillText(
                this.formatNumber(yValue),
                plot.x - 9,
                y + 4
            );
        }

        ctx.restore();
    }


    /* ================================================
       AXES
    ================================================ */

    drawAxes(ctx, plot) {

        ctx.save();

        ctx.strokeStyle = '#9aacc4';

        ctx.lineWidth = 1.5;

        ctx.beginPath();

        ctx.moveTo(plot.x, plot.y);

        ctx.lineTo(
            plot.x,
            plot.y + plot.height
        );

        ctx.lineTo(
            plot.x + plot.width,
            plot.y + plot.height
        );

        ctx.stroke();

        ctx.restore();
    }


    /* ================================================
       DATA LINE AND POINTS
    ================================================ */

    drawData(ctx, plot, values) {

        const isLoad =
            this.graphType === 'load';

        const points = this.data.map(item => {

            const xValue =
                Number(
                    isLoad
                        ? item.loadResistance ?? item.resistance
                        : item.voltage ?? item.inputVoltage ?? 0
                );

            const yValue =
                Number(
                    isLoad
                        ? item.outputVoltage ?? item.voltage
                        : item.currentMilliampere ?? item.current ?? 0
                );

            return {

                x:
                    plot.x +
                    (
                        (xValue - values.minX) /
                        (values.maxX - values.minX)
                    ) * plot.width,

                y:
                    plot.y +
                    plot.height -
                    (
                        (yValue - values.minY) /
                        (values.maxY - values.minY)
                    ) * plot.height

            };

        });


        ctx.save();

        ctx.strokeStyle = '#22d3ee';

        ctx.lineWidth = 2.5;

        ctx.lineJoin = 'round';

        ctx.beginPath();

        points.forEach((point, index) => {

            if (index === 0) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            } else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        });

        ctx.stroke();


        ctx.fillStyle = '#67e8f9';

        points.forEach(point => {

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();

        });

        ctx.restore();
    }


    /* ================================================
       AXIS LABELS
    ================================================ */

    drawAxisLabels(ctx, plot) {

        ctx.save();

        ctx.fillStyle = '#d6e5f5';

        ctx.font = '12px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(

            this.graphType === 'load'
                ? 'Load Resistance (Ω)'
                : 'Input Voltage (V)',

            plot.x + plot.width / 2,

            this.height - 12

        );


        ctx.translate(
            15,
            plot.y + plot.height / 2
        );

        ctx.rotate(-Math.PI / 2);

        ctx.fillText(

            this.graphType === 'load'
                ? 'Output Voltage (V)'
                : 'Diode Current (mA)',

            0,
            0

        );

        ctx.restore();
    }


    /* ================================================
       EMPTY GRAPH MESSAGE
    ================================================ */

    drawEmptyMessage(ctx, plot) {

        ctx.save();

        ctx.fillStyle = '#93a4b8';

        ctx.font = '13px Arial';

        ctx.textAlign = 'center';

        ctx.fillText(

            'Run the experiment to generate graph data',

            plot.x + plot.width / 2,

            plot.y + plot.height / 2

        );

        ctx.restore();
    }


    /* ================================================
       NUMBER FORMAT
    ================================================ */

    formatNumber(value) {

        if (!Number.isFinite(value)) {
            return '0';
        }

        if (Math.abs(value) >= 1000) {

            return value.toFixed(0);
        }

        if (Math.abs(value) >= 10) {

            return value.toFixed(1);
        }

        return value.toFixed(2);
    }


    /* ================================================
       DESTROY
    ================================================ */

    destroy() {

        if (this.resizeObserver) {

            this.resizeObserver.disconnect();

            this.resizeObserver = null;
        }

        this.data = [];

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

}
