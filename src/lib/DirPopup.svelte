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

  }
</script>

<div class="flex justify-end border-gray-500 border-4">
    <button class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100" on:click={getDir}>Select Your Music Directory</button>
</div>
