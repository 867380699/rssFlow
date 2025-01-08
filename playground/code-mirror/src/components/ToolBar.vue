<template>
  <div class="cm-panel-toolbar" :style="gridStyle">
    <template v-for="(row, index) in buttons" :key="index">
      <button v-for="btn in row" :key="btn.id" class="cm-panel-button" @click.prevent="() => onClick(btn)">
        {{ btn.name || btn.value }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['btnClick'])

// export const allButtons = ['up', 'down']

const buttons = ref([
  [
    { id: "back", value: "←" },
    { id: "brace", name: "{ }", value: "{}" },
    { id: "bracket", name: "[ ]", value: "[]" },
    { id: "parenthesis", name: "( )", value: "()" },
    { id: "asterisk", value: "*" },
    { id: "tilde", value: "~" },
    { id: "at", value: "@" },
    { id: "plus", value: "+" },
    { id: "hyphen", value: "-" },
    { id: "forward", value: "→" }
  ], [
    { id: "esc", value: "Esc" },
    { id: "hash", value: "#" },
    { id: "quote", name: '" "', value: '""' },
    { id: "colon", value: ":" },
    { id: "percent", value: "%" },
    { id: "greater-than", value: ">" },
    { id: "slash", value: "/" },
    { id: "exclamation", value: "!" },
    { id: "semicolon", value: ";" },
    { id: "tab", value: "↹" }
  ]])

const gridStyle = computed(() => {
  const columns = Math.max(...buttons.value.map(r => r.length))
  return `display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 4px;`
})
const onClick = (button: { id: string, value: string }) => {
  emit('btnClick', button)
}
</script>

<style lang="less" scoped>

.cm-panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cm-panel-button {
  appearance: none;
  background-color: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px 2px;
  min-width: 16px;
  text-align: center;
  outline: none;
  font-weight: 600;
  font-size: 14px;
  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>