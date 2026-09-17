<script setup>
import { ref } from "vue";
import { faker } from "@faker-js/faker";
import ToolLayout from "./ui/ToolLayout.vue";

const types = [
  ["name", "Nome completo"],
  ["email", "E-mail"],
  ["phone", "Telefone"],
  ["cpf", "CPF"],
  ["cnpj", "CNPJ"],
  ["date", "Data de nascimento"],
  ["address", "Endereço"],
  ["city", "Cidade"],
  ["state", "Estado"],
  ["zip", "CEP"],
  ["lorem", "Lorem ipsum"],
].map(([value, label]) => ({ value, label }));
const selectedType = ref("name");
const result = ref("");
const copied = ref(false);
const loremCount = ref(2);
const loremWords = ref(0);
const digit = () => Math.floor(Math.random() * 10);
function documentNumber(length, weights) {
  const numbers = Array.from({ length }, digit);
  for (const row of weights) {
    const sum = numbers.reduce(
      (total, number, index) => total + number * row[index],
      0,
    );
    const mod = sum % 11;
    numbers.push(mod < 2 ? 0 : 11 - mod);
  }
  return numbers;
}
function cpf() {
  const n = documentNumber(9, [
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  ]);
  return `${n.slice(0, 3).join("")}.${n.slice(3, 6).join("")}.${n.slice(6, 9).join("")}-${n.slice(9).join("")}`;
}
function cnpj() {
  const n = documentNumber(12, [
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  ]);
  return `${n.slice(0, 2).join("")}.${n.slice(2, 5).join("")}.${n.slice(5, 8).join("")}/${n.slice(8, 12).join("")}-${n.slice(12).join("")}`;
}
function generate() {
  copied.value = false;
  const generators = {
    name: () => faker.person.fullName(),
    email: () => faker.internet.email().toLowerCase(),
    phone: () =>
      `(${faker.number.int({ min: 11, max: 99 })}) ${faker.number.int({ min: 90000, max: 99999 })}-${faker.number.int({ min: 1000, max: 9999 })}`,
    cpf,
    cnpj,
    date: () =>
      faker.date
        .birthdate({ min: 1950, max: 2005, mode: "year" })
        .toLocaleDateString("pt-BR"),
    address: () =>
      `${faker.location.street()}, ${faker.number.int({ min: 1, max: 9999 })} — ${faker.location.city()}`,
    city: () => faker.location.city(),
    state: () =>
      faker.helpers.arrayElement([
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
      ]),
    zip: () =>
      `${faker.number.int({ min: 10000, max: 99999 })}-${faker.number.int({ min: 100, max: 999 })}`,
    lorem: () =>
      loremWords.value > 0
        ? faker.lorem.words(Math.min(100, loremWords.value))
        : faker.lorem.paragraphs(Math.min(10, loremCount.value), "\n\n"),
  };
  result.value = generators[selectedType.value]?.() || "";
}
async function copyResult() {
  await navigator.clipboard.writeText(result.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>
<template>
  <ToolLayout
    caption="Dados sintéticos para protótipos e testes. Não representam pessoas reais."
    id="fakedata-main"
  >
    <div class="fake-controls">
      <label class="tool-field"
        >Tipo de dado<select v-model="selectedType" id="fakedata-type-select">
          <option v-for="type in types" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select></label
      ><template v-if="selectedType === 'lorem'"
        ><label class="tool-field"
          >Parágrafos<input
            v-model.number="loremCount"
            type="number"
            min="1"
            max="10" /></label
        ><label class="tool-field"
          >Palavras<input
            v-model.number="loremWords"
            type="number"
            min="0"
            max="100" /></label></template
      ><button class="dark-button" id="fakedata-generate-btn" @click="generate">
        Gerar dado
      </button>
    </div>
    <div v-if="result" class="fake-result" id="fakedata-result">
      <pre id="fakedata-result-text">{{ result }}</pre>
      <button class="outline" @click="copyResult">
        {{ copied ? "Copiado ✓" : "Copiar" }}
      </button>
    </div>
    <div v-else class="tool-empty">
      <span>⌗</span>
      <p>Escolha um tipo e gere o primeiro dado.</p>
    </div>
  </ToolLayout>
</template>
