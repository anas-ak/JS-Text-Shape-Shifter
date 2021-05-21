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


    }())
