<script lang="ts">
  import DirPopup from "./lib/DirPopup.svelte";
  import MainWindow from "./lib/MainWindow.svelte";
  import { onMount } from "svelte";
  let musicDir = "";
  

  onMount(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    musicDir = localStorage.getItem("musicDir");
  })
  function updateDirVar(val: CustomEvent<string>){
    musicDir = val.detail;
    localStorage.setItem("musicDir", musicDir);
  }

</script>

<main class="container bg">
  {#if !musicDir}
  <DirPopup on:updateDir={updateDirVar}/>
  {:else}
  <MainWindow on:updateDir={updateDirVar}/>
  {/if}
</main>

<style>

</style>
