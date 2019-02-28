class Program {
    constructor(name, instructions) {
        this.name = name;
        this.instructions = instructions;
    }

    print_me() {
        var return_string = '';
        for (var i = 0; i < this.instructions.length; i++) {
            return_string += this.instructions[i] + '<br />';
        }

        return return_string;
    }
}

class Storage {
    constructor() {
        this.programs = [];
    }
}

class PCB {
    constructor(program, process_id, start_address, bytes_allocated) {
        this.program = program;
        this.process_id = process_id;
        this.start_address = start_address;
        this.bytes_allocated = bytes_allocated;
        this.program_counter = 0;
        this.next_node = null;
    }

    print_me() {
        var return_string = 'Program: ' + this.program.name + '<br />' +
        'Program Counter: ' + this.program_counter + '<br />' +
        'Start Address: ' + this.start_address + '<br />' +
        'Bytes Allocated: ' + this.bytes_allocated + '<br />';

        if (this.next_node == null) {
            return_string += 'Next PCB: NULL<br />';
        } else {
            return_string += 'Next PCB: Process ID: ' + this.next_node.process_id + '<br />';
        }

        return return_string;
    }
}

class SchedulerQueue {
    constructor(name) {
        this.name = name;
        this.head = null;
        this.tail = null;
    }

    print_me() {
        if (this.head == null) {
            var head_string = 'NULL';
        } else {
            var head_string = 'Process ID: ' + this.head.process_id;
        }
        if (this.tail == null) {
            var tail_string = 'NULL';
        } else {
            var tail_string = 'Process ID: ' + this.tail.process_id;
        }
        return 'Head: ' + head_string + '<br />Tail: ' + tail_string; 
    }

    insert_pcb(pcb) {
        if (this.tail == null) {
            this.head = pcb;
            this.tail = pcb;
        } else {
            this.tail.next_node = pcb;
            this.tail = pcb;
        }
    }
}

class Kernel {
    constructor() {
        this.next_process_id = 0;
        this.current_processes = 0;
        this.next_user_address = 10000;
        this.active_pcbs = []
        this.scheduler_queues = { 'Ready': new SchedulerQueue('Ready')};
    }

    create_process(program) {
        var new_pcb = new PCB(program, this.next_process_id, this.next_user_address, 10000);
        this.active_pcbs.push(new_pcb);
        this.add_to_queue(new_pcb);
        this.next_user_address += 10000;
        this.next_process_id++;
    }

    add_to_queue(pcb) {
        if (pcb.program_counter >= pcb.program.instructions.length) {
            // The process has executed its last instruction
            var add_to = 'Terminate';
        } else if (pcb.program.instructions[pcb.program_counter] == 'HDD') {
            var add_to = 'HDD';
        } else {
            var add_to = 'Ready';
        }

        if (add_to != 'Terminate') {
            this.scheduler_queues[add_to].insert_pcb(pcb);
        } else {
            var found = -1;
            for (var i = 0; i < this.active_pcbs.length; i++) {
                if (pcb == this.active_pcbs[i]) {
                    found = i;
                }
            }
            if (found > -1) {
                this.active_pcbs.splice(found, 1);
            }
        }
    }

    dispatch_to_cpu(cpu) {
        if (this.scheduler_queues['Ready'].head != null) {
            var dispatch_pcb = this.scheduler_queues['Ready'].head;
            
            this.scheduler_queues['Ready'].head = dispatch_pcb.next_node;
            if (this.scheduler_queues['Ready'].head == null) {
                this.scheduler_queues['Ready'].tail = null;
            }

            dispatch_pcb.next_node = null;
            cpu.current_process = dispatch_pcb;
        }
    }

    remove_from_cpu(cpu) {
        if (cpu.current_process != null) {
            this.add_to_queue(cpu.current_process);
            cpu.current_process = null;
        }
    }

    update_storage_queue(queue_name) {
        if (this.scheduler_queues[queue_name].head != null) {
            var update_process = this.scheduler_queues[queue_name].head;
            this.scheduler_queues[queue_name].head = update_process.next_node;
            update_process.program_counter++;
            update_process.next_node = null;
            this.add_to_queue(update_process);

            if (this.scheduler_queues[queue_name].head == null) {
                this.scheduler_queues[queue_name].tail = null;
            }
        }
    }
}

class CPU {
    constructor() {
        this.current_process = null;
    }

    print_me() {
        if (this.current_process == null) {
            return 'KERNEL<br />';
        } else {
            return this.current_process.start_address + this.current_process.program_counter + '<br />';
        }
    }

    execute() {
        if (this.current_process != null) {
            this.current_process.program_counter++;
        }
    }
}

function make_card(h_tag, card_title, card_content) {
    var return_string = '<div class="card"><div class="card-body"><' + h_tag + '>';
    return_string += card_title;
    return_string += '</' + h_tag + '><p>';
    return_string += card_content;
    return_string += '</p></div></div>';

    return return_string;
}

function draw_simulation() {
    var kernel_memory_string = '';
    var user_memory_string = '';
    var storage_string = '';
    for (var key in my_kernel.scheduler_queues) {
        kernel_memory_string += make_card('h5', 'Queue: ' + my_kernel.scheduler_queues[key].name, my_kernel.scheduler_queues[key].print_me());
    }

    for (var i = 0; i < my_kernel.active_pcbs.length; i++) {
        kernel_memory_string += make_card('h5', 'Process ID: ' + my_kernel.active_pcbs[i].process_id, my_kernel.active_pcbs[i].print_me());
        user_memory_string += make_card('h5', 'Process ID: ' + my_kernel.active_pcbs[i].process_id, my_kernel.active_pcbs[i].program.print_me());
    }

    for (var i = 0; i < my_storage.programs.length; i++) {
        storage_button = '<button class="btn btn-primary btn-sm button_execute_program" data-program-id="' + i + '")>Execute Program</button>';
        storage_string += make_card('h5', 'Program Name: ' + my_storage.programs[i].name, 'Instruction List:<br />' + my_storage.programs[i].print_me() + storage_button);
    }

    $('#kernel_memory').html(kernel_memory_string);
    $('#user_memory').html(user_memory_string);
    $('#storage').html(storage_string);
    $('#cpu').html(make_card('h4', 'CPU', 'Current Instruction: <br />' + my_cpu.print_me() + '<button class="btn btn-primary btn-sm" id="button_step_simulation">Step Simulation Forward</button><br />'));
}

var my_cpu;
var my_storage;
var program_a;
var program_b;
var my_kernel;

$(document).ready(function() {
    my_cpu = new CPU();
    my_storage = new Storage();
    program_a = new Program('Program A', ['CPU', 'CPU', 'CPU', 'CPU', 'CPU', 'CPU']);
    program_b = new Program('Program B', ['CPU', 'CPU', 'CPU', 'CPU']);
    my_storage.programs.push(program_a);
    my_storage.programs.push(program_b);

    my_kernel = new Kernel();

    draw_simulation();
});

$(document).on('click', '.button_execute_program', function(event) {
    event.preventDefault();

    var program_id = $(this).attr('data-program-id');

    my_kernel.create_process(my_storage.programs[program_id]);

    draw_simulation();
});

$(document).on('click', '#button_step_simulation', function(event) {
    event.preventDefault();

    my_cpu.execute();
    my_kernel.remove_from_cpu(my_cpu);
    my_kernel.dispatch_to_cpu(my_cpu);

    draw_simulation();
});