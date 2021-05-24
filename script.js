var S = {
    init: function() {
        var action = window.location.href, i = action.indexOf('?a=');

        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');

        if(i !== -1) {
            S.UI.simulate(decodeURI(action).substring(i + 3));
        } else {
            S.UI.simulate('Shape|Shifter|Type|to start|#rectangle|#countdown 3||');
        }

        S.Drawing.loop(function () {
            S.Shape.render();
        });
    }
};

S.Drawing = (function () {
    var canvas, 
        context,
        renderFn,
        requestFrame = window.requestAnimationFrame       || 
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame    || 
                       window.oRequestAnimationFrame      ||
                       window.msRequestAnimationFrame     || 
                       function(callback) {
                           window.setTimeout(callback, 1000/60);
                       };
    
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();

            window.addEventListener('resize', function(e) {
                S.Drawing.adjustCanvas();
            });
        },

        loop: function (fn) {
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },

        adjustCanvas: function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        },

        clearFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        },

        getArea: function () {
            return { w: canvas.width, h: canvas.height }
        },

        drawCircle: function(p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        }
    }
}());

/*=============*/

S.UI = (function () {
    var input = document.querySelector('.ui-input'),
        ui = document.querySelector('.ui'),
        help = document.querySelector('.help'),
        commands = document.querySelector('.commands'),
        overlay = document.querySelector('.overlay'),
        canvas = document.querySelector('.canvas'),
        interval,
        isTouch = false, // ('ontouchstart' in window || navigator.msMaxTouchPoints)
        currentAction,
        resizeTimer,
        time, 
        maxShapeSize = 30,
        firstAction = true,
        sequence = [],
        cmd = '#';

        function formatTime(date) {
            var h = date.getHours(),
                m = date.getMinutes(),
            m = m < 10 ? '0' + m : m;
            return h + ':' + m;
        }

        function getValue(value) {
            return value && value.split(' ')[1];
        }

        function getAction(value) {
            value = value && value.split(' ') [0];
            return value && value[0] === cmd && value.substring(1);
        }

        function timedAction(fn, delay, max, reverse) {
            clearInterval(interval);
            currentAction = reverse ? max : 1;
            fn(currentAction);
        

            if(!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
                interval = setInterval(function() {
                    currentAction = reverse ? currentAction - 1 : currentAction + 1;
                    fn(currentAction);

                    if((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                        clearInterval(interval);
                    }
                }, delay);
            }
        }

        function reset(destroy) {
            clearInterval(interval);
            sequence = [];
            time = null;
            destroy && S.Shape.switchShape(S.ShapeBuilder.letter(''));
        }
        /************/

        function performAction(value) {
            var action,
                value,
                current;

            overlay.classList.remove('overlay--visible');
            sequence = typeof(value) === 'object' ? value : sequence.concat(value.split('|'));
            input.value = '';
            checkInputWidth();

            timedAction(function (index) {
                current = sequence.shift();
                action = getAction(current);
                value = getValue(current);

                switch(action) {
                    case 'countdown':
                        value = parseInt(value) || 10;
                        value = value > 0 ? value : 10;

                        timedAction(function (index) {
                            if(index === 0) {
                                if(sequence.length === 0) {
                                    S.Shape.switchShape(S.ShapeBuilder.letter(''));
                                } else {
                                    performAction(sequence);
                                }
                            } else {
                                S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                            }
                        }, 1000, value, true);
                        break;

                        case 'rectangle':
                            value = value && value.split('x');
                            value = (value && value.length === 2) ? value : [maxShapeSize, maxShapeSize / 2];

                            S.Shape.switchShape(S.ShapeBuilder.rectangle(Math.min(maxShapeSize, parseInt(value[0])), Math.min(maxShapeSize, parseInt(value[1]))));
                            break;

                        case 'circle':
                            value = parseInt(value) || maxShapeSize;
                            value = Math.min(value, maxShapeSize);
                            S.Shape.switchShape(S.ShapeBuilder.circle(value));
                            break;

                        case 'time':
                            var t = formatTime(new Date());

                            if(sequence.length > 0) {
                                S.Shape.switchShape(S.ShapeBuilder.letter(t));
                            } else { 
                                timedAction(function () {
                                    t = formatTime(new Date());

                                    if(t !== time) {
                                        time = t;
                                        S.Shape.switchShape(S.ShapeBuilder.letter(time));
                                    }
                                }, 1000);
                            }
                            break;

                            default:
                                S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'What?' : current));
                }
            }, 2000, sequence.length);
        }

        function checkInputWidth(e) {
            if(input.value.length > 18) {
                ui.classList.add('ui--wide');
            } else {
                ui.classList.remove('ui--wide');
            }

            if(firstAction && input.value.length > 0) {
                ui.classList.add('ui--enter');
            } else { 
                ui.classList.remove('ui--enter');
            }
        }

        function bindEvents() {
            document.body.addEventListener('keydown', function(e){ 
                input.focus();

                if(e.keyCode === 13) {
                    firstAction = false;
                    reset();
                    performAction(input.value);
                }
            });

            input.addEventListener('input', checkInputWidth);
            input.addEventListener('change', checkInputWidth);
            input.addEventListener('focus', checkInputWidth);

            help.addEventListener('click', function(e) {
                overlay.classList.toggle('overlay--visible');
                overlay.classList.contains('overlay--visible') && reset(true);
            });

            commands.addEventListener('click', function (e) {
                var el, 
                    info,
                    demo, 
                    tab,
                    active,
                    url;

                if(e.target.classList.contains('commands-item')) {
                    el = e.target;
                } else {
                    el = e.target.parentNode.classList.contains('commands-item') ? e.target.parentNode : e.target.parentNode.parentNode;
                }

                info = el && el.querySelector('.commands-item-info');
                demo = el && info.getAttribute('data-demo');
                url = el && info.getAttribute('data-url');

                if(info) {
                    overlay.classList.remove('overlay--visible');

                    if(demo) {
                        input.value = demo;

                        if(isTouch) {
                            reset();
                            performAction(input.value);
                        } else {
                            input.focus();
                        }
                    } else if (url) {

                    }
                }
            });

            canvas.addEventListener('click', function(e) {
                overlay.classList.remove('overlay--visible');
            });
        }

        function init() {
            bindEvents();
            input.focus();
            isTouch && document.body.classList.add('touch');
        }

        // Init
        init();

        return {
            simulate: function (action) {
                performAction(action);
            }
        }
    }());
