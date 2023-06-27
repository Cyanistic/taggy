<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri"
  import { open } from "@tauri-apps/api/dialog"
  import { readDir } from '@tauri-apps/api/fs';
  async function getDir(){
    const selected = await open({
      title: "Select your music directory",
      directory: true,
      multiple: false
    })
    const files = await readDir(selected as string)
    console.log(files);
  }
</script>

<div class="flex self-center">
  <p>Choose your music directory:</p>
  <button class="bg-gray-900" on:click={getDir}>Select Directory</button>
</div>
