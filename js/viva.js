
/* =========================================
   ZENER-LAB-360
   FILE: viva.js

   Interactive Viva Questions & Answers
========================================= */


/* ---------- VIVA QUESTION DATABASE ---------- */

export const vivaQuestions = [

    {
        id: 1,
        category: 'Basic Concepts',

        question: 'What is a Zener diode?',

        answer:
            'A Zener diode is a specially designed semiconductor diode that operates in reverse breakdown under controlled conditions.',

        explanation:
            'It is commonly used for voltage regulation.'
    },

    {
        id: 2,
        category: 'Basic Concepts',

        question: 'What is the main purpose of a Zener diode?',

        answer:
            'The main purpose of a Zener diode is voltage regulation.',

        explanation:
            'It maintains an approximately constant voltage across a load when operating within its specified regulation range.'
    },

    {
        id: 3,
        category: 'Basic Concepts',

        question: 'What is the Zener breakdown voltage?',

        answer:
            'The reverse voltage at which a Zener diode begins conducting significantly in its breakdown region is called the Zener breakdown voltage.',

        explanation:
            'It is represented by VZ.'
    },

    {
        id: 4,
        category: 'Forward Bias',

        question: 'What is forward bias?',

        answer:
            'A diode is forward biased when its P-side is connected to the positive terminal and its N-side to the negative terminal of the supply.',

        explanation:
            'For a silicon diode, noticeable forward conduction generally starts around 0.7 V.'
    },

    {
        id: 5,
        category: 'Forward Bias',

        question: 'How does a Zener diode behave in forward bias?',

        answer:
            'In forward bias, a Zener diode behaves approximately like an ordinary silicon PN junction diode.',

        explanation:
            'It conducts current after the forward voltage reaches its conduction region.'
    },

    {
        id: 6,
        category: 'Reverse Bias',

        question: 'What is reverse bias?',

        answer:
            'A diode is reverse biased when its P-side is connected to the negative terminal and its N-side to the positive terminal of the supply.',

        explanation:
            'In normal reverse blocking, only a small leakage current flows.'
    },

    {
        id: 7,
        category: 'Reverse Bias',

        question: 'What happens when the reverse voltage reaches the Zener voltage?',

        answer:
            'The diode enters its reverse breakdown region and reverse current increases significantly.',

        explanation:
            'A suitable series resistor is necessary to limit current.'
    },

    {
        id: 8,
        category: 'Reverse Bias',

        question: 'Why is a series resistor connected with a Zener diode?',

        answer:
            'The series resistor limits the current flowing through the Zener diode and helps prevent excessive current.',

        explanation:
            'Without current limiting, the diode may exceed its rated power or current.'
    },

    {
        id: 9,
        category: 'Characteristics',

        question: 'What is the V-I characteristic of a diode?',

        answer:
            'It is the graphical relationship between the voltage across a diode and the current flowing through it.',

        explanation:
            'The graph has forward and reverse bias regions.'
    },

    {
        id: 10,
        category: 'Characteristics',

        question: 'What is the knee voltage?',

        answer:
            'The knee voltage is the approximate forward voltage beyond which diode current begins increasing rapidly.',

        explanation:
            'For a silicon diode it is commonly around 0.7 V, depending on current and temperature.'
    },

    {
        id: 11,
        category: 'Load Regulation',

        question: 'What is load regulation?',

        answer:
            'Load regulation describes how well a power supply maintains its output voltage when the load changes.',

        explanation:
            'A good voltage regulator maintains nearly constant output voltage over its specified operating range.'
    },

    {
        id: 12,
        category: 'Load Regulation',

        question: 'What happens to Zener current when load current increases?',

        answer:
            'In a shunt Zener regulator, if the input and series resistor remain fixed, an increase in load current generally reduces Zener current.',

        explanation:
            'This continues while the Zener remains within its specified regulation region.'
    },

    {
        id: 13,
        category: 'Load Regulation',

        question: 'Why is a Zener diode connected in parallel with the load?',

        answer:
            'It is connected in parallel with the load so that the Zener voltage is approximately the same as the load voltage.',

        explanation:
            'This allows it to maintain a nearly constant output voltage within its operating range.'
    },

    {
        id: 14,
        category: 'Instruments',

        question: 'How is an ammeter connected in a circuit?',

        answer:
            'An ammeter is connected in series with the circuit branch whose current is being measured.',

        explanation:
            'An ammeter has low internal resistance.'
    },

    {
        id: 15,
        category: 'Instruments',

        question: 'How is a voltmeter connected in a circuit?',

        answer:
            'A voltmeter is connected in parallel across the component whose voltage is being measured.',

        explanation:
            'A voltmeter has high internal resistance.'
    },

    {
        id: 16,
        category: 'Instruments',

        question: 'What is the function of a potentiometer in this experiment?',

        answer:
            'A potentiometer can be used as an adjustable resistance to vary a circuit parameter.',

        explanation:
            'Its actual role depends on the circuit arrangement used in the laboratory.'
    },

    {
        id: 17,
        category: 'Instruments',

        question: 'What is the function of a breadboard?',

        answer:
            'A breadboard is used to assemble and test temporary electronic circuits without soldering.',

        explanation:
            'Its internal contact strips connect specific groups of holes.'
    },

    {
        id: 18,
        category: 'Calculations',

        question: 'What is the formula for Zener diode power?',

        answer:
            'PZ = VZ × IZ',

        explanation:
            'Here, PZ is Zener power, VZ is Zener voltage and IZ is Zener current.'
    },

    {
        id: 19,
        category: 'Calculations',

        question: 'What is the unit of electric current?',

        answer:
            'The SI unit of electric current is Ampere (A).',

        explanation:
            'Small currents in diode experiments are often expressed in milliampere (mA).'
    },

    {
        id: 20,
        category: 'Calculations',

        question: 'What is the unit of resistance?',

        answer:
            'The SI unit of electrical resistance is Ohm (Ω).',

        explanation:
            'Resistance is commonly represented by the symbol R.'
    },

    {
        id: 21,
        category: 'Safety',

        question: 'Why should the supply voltage be increased gradually?',

        answer:
            'It helps observe the diode response carefully and avoid exceeding the specified operating limits.',

        explanation:
            'The supply should be current-limited and operated according to the laboratory instructions.'
    },

    {
        id: 22,
        category: 'Safety',

        question: 'What should be checked before switching on the circuit?',

        answer:
            'Check diode polarity, component placement, meter connections, resistor value and power-supply settings.',

        explanation:
            'The circuit should be inspected before applying the low-voltage DC supply.'
    }
];


/* =========================================
   VIVA APPLICATION
========================================= */

export class VivaModule {

    constructor(container, options = {}) {

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            throw new Error(
                'Viva container not found.'
            );
        }

        this.container = container;

        this.questions =
            options.questions || vivaQuestions;

        this.currentIndex = 0;

        this.showingAnswer = false;

        this.score = 0;

        this.answeredQuestions = new Set();

        this.selectedCategory = 'All';

        this.render();
    }


    /* =====================================
       1. GET CATEGORIES
    ===================================== */

    getCategories() {

        return [
            'All',
            ...new Set(
                this.questions.map(
                    question => question.category
                )
            )
        ];
    }


    /* =====================================
       2. GET FILTERED QUESTIONS
    ===================================== */

    getFilteredQuestions() {

        if (this.selectedCategory === 'All') {
            return this.questions;
        }

        return this.questions.filter(
            question =>
                question.category ===
                this.selectedCategory
        );
    }


    /* =====================================
       3. GET CURRENT QUESTION
    ===================================== */

    getCurrentQuestion() {

        const questions =
            this.getFilteredQuestions();

        if (!questions.length) {
            return null;
        }

        this.currentIndex = Math.min(
            this.currentIndex,
            questions.length - 1
        );

        return questions[this.currentIndex];
    }


    /* =====================================
       4. MAIN RENDER
    ===================================== */

    render() {

        const question =
            this.getCurrentQuestion();

        const categories =
            this.getCategories();

        if (!question) {

            this.container.innerHTML = `
                <div class="viva-empty">
                    No questions available.
                </div>
            `;

            return;
        }

        this.container.innerHTML = `

            <div class="viva-module">

                <div class="viva-header">

                    <div>
                        <span class="viva-label">
                            KNOWLEDGE CHECK
                        </span>

                        <h3>
                            Zener Diode Viva
                        </h3>
                    </div>

                    <div class="viva-score">
                        Score: ${this.score}
                    </div>

                </div>


                <div class="viva-categories">

                    ${categories.map(category => `

                        <button
                            type="button"
                            class="viva-category ${
                                this.selectedCategory === category
                                    ? 'active'
                                    : ''
                            }"
                            data-category="${category}"
                        >
                            ${category}
                        </button>

                    `).join('')}

                </div>


                <div class="viva-progress">

                    <span>
                        Question ${this.currentIndex + 1}
                        of ${this.getFilteredQuestions().length}
                    </span>

                    <span>
                        ${this.answeredQuestions.size}
                        answered
                    </span>

                </div>


                <div class="viva-question-card">

                    <div class="viva-question-category">
                        ${question.category}
                    </div>

                    <h4>
                        ${question.question}
                    </h4>


                    <div class="viva-answer ${
                        this.showingAnswer ? 'visible' : ''
                    }">

                        ${
                            this.showingAnswer
                                ? `
                                    <strong>Answer:</strong>

                                    <p>
                                        ${question.answer}
                                    </p>

                                    <small>
                                        ${question.explanation}
                                    </small>
                                `
                                : `
                                    <p>
                                        Think about your answer
                                        before revealing it.
                                    </p>
                                `
                        }

                    </div>


                    <div class="viva-actions">

                        <button
                            type="button"
                            class="viva-reveal"
                            data-action="reveal"
                        >
                            ${
                                this.showingAnswer
                                    ? 'Answer Shown'
                                    : 'Show Answer'
                            }
                        </button>

                        <button
                            type="button"
                            class="viva-next"
                            data-action="next"
                        >
                            Next Question →
                        </button>

                    </div>

                </div>


                <div class="viva-bottom">

                    <button
                        type="button"
                        data-action="previous"
                    >
                        ← Previous
                    </button>

                    <button
                        type="button"
                        data-action="reset"
                    >
                        Reset Viva
                    </button>

                </div>

            </div>
        `;

        this.bindEvents();
    }


    /* =====================================
       5. EVENT LISTENERS
    ===================================== */

    bindEvents() {

        this.container
            .querySelectorAll('[data-action]')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const action =
                            button.dataset.action;

                        this.handleAction(action);
                    }
                );
            });


        this.container
            .querySelectorAll('[data-category]')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        this.selectCategory(
                            button.dataset.category
                        );
                    }
                );
            });
    }


    /* =====================================
       6. HANDLE ACTIONS
    ===================================== */

    handleAction(action) {

        switch (action) {

            case 'reveal':

                this.revealAnswer();

                break;

            case 'next':

                this.nextQuestion();

                break;

            case 'previous':

                this.previousQuestion();

                break;

            case 'reset':

                this.reset();

                break;
        }
    }


    /* =====================================
       7. REVEAL ANSWER
    ===================================== */

    revealAnswer() {

        const question =
            this.getCurrentQuestion();

        if (!question) {
            return;
        }

        this.showingAnswer = true;

        this.answeredQuestions.add(
            question.id
        );

        this.render();
    }


    /* =====================================
       8. NEXT QUESTION
    ===================================== */

    nextQuestion() {

        const questions =
            this.getFilteredQuestions();

        if (
            this.currentIndex <
            questions.length - 1
        ) {

            this.currentIndex++;

            this.showingAnswer = false;

            this.render();

        } else {

            this.showCompletionMessage();
        }
    }


    /* =====================================
       9. PREVIOUS QUESTION
    ===================================== */

    previousQuestion() {

        if (this.currentIndex > 0) {

            this.currentIndex--;

            this.showingAnswer = false;

            this.render();
        }
    }


    /* =====================================
       10. SELECT CATEGORY
    ===================================== */

    selectCategory(category) {

        this.selectedCategory = category;

        this.currentIndex = 0;

        this.showingAnswer = false;

        this.render();
    }


    /* =====================================
       11. COMPLETION MESSAGE
    ===================================== */

    showCompletionMessage() {

        const questionCount =
            this.getFilteredQuestions().length;

        this.container.innerHTML = `

            <div class="viva-complete">

                <h3>
                    Viva Questions Completed!
                </h3>

                <p>
                    You have reached the end of this
                    question category.
                </p>

                <p>
                    Questions answered:
                    ${this.answeredQuestions.size}
                </p>

                <button
                    type="button"
                    data-action="reset"
                >
                    Restart Viva
                </button>

            </div>
        `;

        this.bindEvents();
    }


    /* =====================================
       12. RESET VIVA
    ===================================== */

    reset() {

        this.currentIndex = 0;

        this.showingAnswer = false;

        this.score = 0;

        this.answeredQuestions.clear();

        this.selectedCategory = 'All';

        this.render();
    }


    /* =====================================
       13. DESTROY MODULE
    ===================================== */

    destroy() {

        this.container.innerHTML = '';

        this.answeredQuestions.clear();
    }

}


/* =========================================
   FACTORY FUNCTION
========================================= */

export function createVivaModule(
    container,
    options = {}
) {

    return new VivaModule(
        container,
        options
    );
}


/* =========================================
   DEFAULT EXPORT
========================================= */

export default VivaModule;

