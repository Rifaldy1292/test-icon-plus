<script setup>
import { computed, ref } from "vue";
import { watch, onMounted } from "vue";
import { getWorkflowRifky, createItem, updateItem } from "../services/api.js";
const leftPanel = ref(null);
const rightPanel = ref(null);
const isResizing = ref(false);
let resizeAnimationFrameId = null;

const showModal = ref(false);
const modalTaskType = ref("");
const currentParentId = ref(null);
const zoomLevel = ref(1);
const offset = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const offsetStart = ref({ x: 0, y: 0 });

const tasks = ref([
  {
    id: 1,
    name: "Start",
    taskReferenceName: "start",
    type: "start",
    inputParameters: {},
  },
  {
    id: 2,
    name: "Final",
    taskReferenceName: "final",
    type: "final",
    inputParameters: {},
  },
]);
onMounted(async () => {
  try {
    const response = await getWorkflowRifky("rifky");
    const fetchedTasks = response.data.tasks || [];
    tasks.value = [
      { ...tasks.value[0] },
      ...fetchedTasks,
      { ...tasks.value[tasks.value.length - 1] },
    ];
  } catch (err) {
    console.log(err);
  }
});

const templateWorkflow = ref({
  name: "rifky",
  description: "Template workflow rifky",
  version: 1,
  schemaVersion: 2,
  inputParameters: [],
  outputParameters: {},
  tasks: tasks,
});

function openModal(parentId) {
  showModal.value = true;
  currentParentId.value = parentId;
}
function selectTaskType(type) {
  showModal.value = false;

  if (type === "HTTP") {
    const newTask = {
      id: Date.now(),
      name: "get_population_data2",
      taskReferenceName: "get_population_data2",
      type: "HTTP",
      inputParameters: {
        http_request: {
          uri: "https://datausa.io/api/data?drilldowns=Nation&measures=Population",
          method: "GET",
        },
      },
    };
    const insertIndex = tasks.value.length - 1;
    tasks.value.splice(insertIndex, 0, newTask);
  } else if (type === "INLINE") {
    const newTask = {
      id: Date.now(),
      name: "perkalian",
      taskReferenceName: "perkalian_ref",
      type: "INLINE",
      inputParameters: {
        expression: `(function () {
          return $.angka1 * $.angka2;
        })`,
        evaluatorType: "graaljs",
        angka1: "${workflow.input.angka1}",
        angka2: "${workflow.input.angka2}",
      },
    };
    const insertIndex = tasks.value.length - 1;
    tasks.value.splice(insertIndex, 0, newTask);
  } else if (type === "SIMPLE") {
    const newTask = {
      id: Date.now(),
      name: "simple_task",
      taskReferenceName: "simple_task_ref",
      type: "SIMPLE",
      inputParameters: {
        param1: "contoh_value",
      },
    };
    const insertIndex = tasks.value.length - 1;
    tasks.value.splice(insertIndex, 0, newTask);
  }
}

const startResize = () => {
  isResizing.value = true;
};
const stopResize = () => {
  isResizing.value = false;

  if (resizeAnimationFrameId) {
    cancelAnimationFrame(resizeAnimationFrameId);
    resizeAnimationFrameId = null;
  }
};
const handleResize = (event) => {
  if (!isResizing.value || resizeAnimationFrameId) {
    return;
  }

  resizeAnimationFrameId = requestAnimationFrame(() => {
    const container = leftPanel.value.parentElement;
    const containerWidth = container.offsetWidth;
    const cursorX = event.clientX - container.getBoundingClientRect().left;
    const newLeftWidth = (cursorX / containerWidth) * 100;

    if (newLeftWidth > 15 && newLeftWidth < 85) {
      leftPanel.value.style.width = `${newLeftWidth}%`;
      rightPanel.value.style.width = `${100 - newLeftWidth}%`;
    }
    resizeAnimationFrameId = null;
  });
};

function zoomIn() {
  zoomLevel.value = Math.min(2, zoomLevel.value + 0.1);
}
function zoomOut() {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1);
}
function onWheelCanvas(e) {
  if (e.ctrlKey) {
    e.preventDefault();
    zoomLevel.value = Math.max(
      0.5,
      Math.min(2, zoomLevel.value + (e.deltaY > 0 ? -0.1 : 0.1))
    );
  }
}
function onMouseDownCanvas(e) {
  if (e.target !== e.currentTarget) return;
  isPanning.value = true;
  panStart.value = { x: e.clientX, y: e.clientY };
  offsetStart.value = { ...offset.value };
}
function onMouseMoveCanvas(e) {
  if (!isPanning.value) return;

  const dx = (e.clientX - panStart.value.x) / zoomLevel.value;
  const dy = (e.clientY - panStart.value.y) / zoomLevel.value;

  offset.value = {
    x: offsetStart.value.x + dx,
    y: offsetStart.value.y + dy,
  };
}
function onMouseUpCanvas() {
  isPanning.value = false;
}
const codeValue = computed(() =>
  JSON.stringify(templateWorkflow.value, null, 2)
);

watch(
  tasks,
  (newTasks) => {
    templateWorkflow.value.tasks = newTasks;
  },
  { deep: true }
);

function onCodeInput(e) {
  codeValue.value = e.target.value;
  try {
    const parsed = JSON.parse(e.target.value);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          typeof item === "object" &&
          "id" in item &&
          "name" in item &&
          "taskReferenceName" in item &&
          "type" in item
      )
    ) {
      tasks.value = parsed;
    } else {
    }
  } catch (err) {}
}
const activeTab = ref("workflow");
async function saveWorkflow() {
  const workflowData = {
    name: "rifky",
    description: "Workflow dengan nama rifky",
    version: 1,
    schemaVersion: 2,
    ownerEmail: "rifky@example.com",
    inputParameters: [],
    outputParameters: {},
    tasks: tasks.value
      .filter((task) => task.type !== "start" && task.type !== "final")
      .map(({ id, ...task }) => task),
  };

  try {
    await updateItem([workflowData]);
    alert("Workflow berhasil di-update!");
  } catch (err) {
    if (err.response && err.response.status !== 200) {
      try {
        await createItem([workflowData]);
        alert("Workflow baru berhasil dibuat!");
      } catch (postErr) {
        console.error(postErr);
        alert("Gagal membuat workflow baru!");
      }
    } else {
      console.error(err);
      alert("Gagal meng-update workflow!");
    }
  }
}
</script>

<template>
  <div
    class="flex h-screen select-none overflow-hidden"
    @mousemove="handleResize"
    @mouseup="stopResize"
    @mouseleave="stopResize"
  >
    <div
      ref="leftPanel"
      class="bg-gray-100 overflow-hidden relative"
      style="width: 60%"
    >
      <div class="absolute z-10 top-4 left-4 flex gap-2">
        <button
          @click="zoomOut"
          class="bg-white rounded shadow px-3 py-1 font-bold text-lg"
        >
          -
        </button>
        <button
          @click="zoomIn"
          class="bg-white rounded shadow px-3 py-1 font-bold text-lg"
        >
          +
        </button>
        <span class="bg-white rounded shadow px-2 py-1 text-xs ml-2"
          >Zoom: {{ Math.round(zoomLevel * 100) }}%</span
        >
        <button
          class="bg-green-300 rounded shadow px-3 py-1 text-lg cursor-pointer"
          @click="saveWorkflow"
        >
          Save
        </button>
      </div>

      <div
        class="absolute top-0 left-0"
        :style="{
          width: '3200px',
          height: '3200px',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomLevel})`,
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          cursor: isPanning ? 'grabbing' : 'grab',
        }"
        @wheel="onWheelCanvas"
        @mousedown="onMouseDownCanvas"
        @mousemove="onMouseMoveCanvas"
        @mouseup="onMouseUpCanvas"
        @mouseleave="onMouseUpCanvas"
      >
        <div
          v-for="(taskItem, index) in templateWorkflow.tasks"
          :key="taskItem.id"
          :class="[
            'absolute left-32 w-50 h-30  bg-white border-2 shadow flex flex-col items-center justify-center',
            taskItem.type === 'start' || taskItem.type === 'final'
              ? 'rounded-full'
              : 'rounded-md',
          ]"
          :style="{ top: index * 150 + 'px' }"
        >
          <div>{{ taskItem.name }}</div>
          <div>{{ taskItem.type }}</div>

          <div
            v-if="index < tasks.length - 1"
            class="absolute left-1/2 -translate-x-1/2 w-1 bg-gray-400"
            :style="{ top: '100%', height: '100px' }"
          ></div>

          <button
            v-if="index === tasks.length - 2 && taskItem.type !== 'final'"
            @click="openModal(taskItem.id)"
            class="absolute -bottom-[12px] left-1/2 -translate-x-1/2 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div
      class="w-2 bg-gray-300 cursor-ew-resize hover:bg-gray-500"
      @mousedown="startResize"
    ></div>

    <div ref="rightPanel" class="bg-gray-200 overflow-auto" style="width: 40%">
      <div
        class="h-10 bg-indigo-500 flex items-center rounded-t-lg overflow-hidden"
      >
        <div
          class="w-1/2 text-center font-semibold cursor-pointer h-full flex items-center justify-center"
          :class="
            activeTab === 'workflow'
              ? 'text-white hover:bg-indigo-600'
              : 'bg-white text-indigo-600 shadow'
          "
          @click="activeTab = 'workflow'"
        >
          Workflow
        </div>
        <div
          class="w-1/2 text-center font-semibold cursor-pointer h-full flex items-center justify-center"
          :class="
            activeTab === 'code'
              ? 'text-white hover:bg-indigo-600'
              : 'bg-white text-indigo-600 shadow'
          "
          @click="activeTab = 'code'"
        >
          Code
        </div>
      </div>

      <div class="p-8">
        <div
          v-if="activeTab === 'workflow'"
          class="text-gray-700 font-semibold"
        >
          <h2 class="text-xl font-bold mb-4">
            Daftar Task Workflow : /{{ templateWorkflow.name }}
          </h2>
          <div class="flex flex-col gap-4">
            <div
              v-for="(task, index) in tasks"
              :key="task.taskReferenceName || index"
              class="bg-white rounded-2xl shadow p-4 border flex flex-col gap-1"
            >
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="w-6 h-6 flex items-center justify-center rounded-full font-bold text-white"
                  :class="{
                    'bg-blue-500': index === 0,
                    'bg-green-500': index === tasks.length - 1,
                    'bg-gray-400': index !== 0 && index !== tasks.length - 1,
                  }"
                >
                  {{
                    index === 0 ? "S" : index === tasks.length - 1 ? "F" : index
                  }}
                </span>
                <span class="font-semibold text-lg">{{ task.name }}</span>
                <span class="text-xs px-2 py-1 rounded bg-gray-100 ml-2">{{
                  task.type
                }}</span>
              </div>
              <div class="text-sm text-gray-500">
                <div v-if="task.description">
                  <b>Deskripsi:</b> {{ task.description }}
                </div>
                <div><b>Reference:</b> {{ task.taskReferenceName }}</div>
                <div
                  v-if="
                    task.inputParameters &&
                    Object.keys(task.inputParameters).length
                  "
                >
                  <b>Input:</b>
                  <ul class="pl-4 list-disc">
                    <li v-for="(val, key) in task.inputParameters" :key="key">
                      {{ key }}: {{ val }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div v-if="tasks.length === 0" class="text-center text-gray-400">
              Belum ada data task.
            </div>
          </div>
        </div>

        <div v-else class="bg-black rounded-md p-4 min-h-[320px] text-left">
          <textarea
            class="w-full h-[600px] bg-transparent text-green-400 font-mono outline-none resize-none"
            v-model="codeValue"
            @input="onCodeInput"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="Edit JSON tasks di sini..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="showModal"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
  >
    <div
      class="bg-white p-6 rounded-2xl shadow-2xl min-w-[260px] flex flex-col gap-3 items-center border"
    >
      <div class="font-semibold text-lg mb-2">Pilih Tipe Task</div>
      <button
        @click="selectTaskType('INLINE')"
        class="w-full py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 mb-2"
      >
        INLINE
      </button>
      <button
        @click="selectTaskType('HTTP')"
        class="w-full py-2 rounded bg-blue-500 text-white hover:bg-blue-600 mb-2"
      >
        HTTP
      </button>
      <button
        @click="selectTaskType('SIMPLE')"
        class="w-full py-2 rounded bg-green-500 text-white hover:bg-green-600"
      >
        SIMPLE
      </button>
      <button @click="showModal = false" class="mt-4 text-xs text-gray-500">
        Tutup
      </button>
    </div>
  </div>
</template>
