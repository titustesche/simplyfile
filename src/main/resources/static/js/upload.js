window.onload = () => {
    const uploadForm = document.getElementById("uploadForm");
    uploadForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(uploadForm);
        fetch("/file/upload", {
            method: "POST",
            body: formData
        }).then(async r => {
            if (r.ok) {
                alert("File uploaded successfully");
                console.log(await r.json())
            } else {
                alert("Failed to upload file");
            }
        });
    });
}