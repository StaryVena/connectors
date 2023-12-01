const imageElement = document.getElementById('myImage');
const dropdownElement = document.getElementById('dropdownList');
const layerColorPickersContainer = document.getElementById('layerColorPickers');
const checkboxesContainer = document.getElementById('checkboxes');
const imageUrlContainer = document.getElementById('imageUrl');

function updateImageUrl() {
    const selectedConnector = dropdownElement.value;
    let imageUrl = `${window.location.protocol}//${window.location.host}/api/v1/connector/${selectedConnector}.png?`;
    let params = '';

    document.querySelectorAll('.layerColorPicker').forEach((picker, index) => {
        const layerParam = `l${index + 1}`;
        params += `&${layerParam}=${picker.value.slice(1)}`;
    });
    imageUrl += params.slice(1);

    document.querySelectorAll('#checkboxes input[type="checkbox"]:checked').forEach((checkbox, index) => {
        imageUrl += `&${checkbox.name}=${checkbox.nextElementSibling.value.slice(1)}`;
    });

    let bgCheckbox = document.getElementById("bg-checkbox");
    let bgColor = document.getElementById("bg-color");

    if(bgCheckbox.checked == true){
        imageUrl += `&bg=${bgColor.value.slice(1)}`;
    }

    imageUrlContainer.value = imageUrl;
    imageElement.src = imageUrl;
}

function copyUrl() {
    var copyText = document.getElementById("imageUrl");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    alert("Copied the text: " + copyText.value);
}

let bgCheckbox = document.getElementById("bg-checkbox");
bgCheckbox.addEventListener('change', () => {
    updateImageUrl();
});

let bgColor = document.getElementById("bg-color");
bgColor.addEventListener('change', () => {
    updateImageUrl();
});

fetch('/api/v1/connectors.json')
    .then(response => response.json())
    .then(data => {
        data.connectors.forEach(connector => {
            const option = document.createElement('option');
            option.value = connector;
            option.text = connector;
            dropdownElement.appendChild(option);
        });
        dropdownElement.addEventListener('change', () => {
            const selectedConnector = dropdownElement.value;
            fetch(`/api/v1/connector/${selectedConnector}.json`)
                .then(response => response.json())
                .then(connectorData => {
                    layerColorPickersContainer.innerHTML = '';
                    connectorData.layers.forEach((layer, index) => {
                        let div = document.createElement("div");
                        let label = document.createElement("label");
                        label.innerHTML = `Layer ${layer}:`;
                        const layerColorPicker = document.createElement('input');
                        layerColorPicker.type = 'color';
                        layerColorPicker.className = 'layerColorPicker';
                        layerColorPicker.value = index % 2 == 0 ? '#000000' : "#FFFFFF";
                        layerColorPicker.addEventListener('change', () => {
                            updateImageUrl();
                        });
                        div.appendChild(label);
                        div.appendChild(layerColorPicker);
                        layerColorPickersContainer.appendChild(div);
                    });

                    checkboxesContainer.innerHTML = '';
                    data.special.forEach(special => {
                        let div = document.createElement('div');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = special;
                        checkbox.name = special;
                        checkbox.className = "marginLeft";
                        checkbox.addEventListener('change', () => {
                            updateImageUrl();
                        });

                        const specialColorPicker = document.createElement('input');
                        specialColorPicker.type = 'color';
                        specialColorPicker.value = '#FF0000';
                        specialColorPicker.addEventListener('change', () => {
                            updateImageUrl();
                        });

                        const label = document.createElement('label');
                        label.htmlFor = special;
                        label.appendChild(document.createTextNode(special));
                        div.appendChild(label);
                        div.appendChild(checkbox);
                        div.appendChild(specialColorPicker);
                        checkboxesContainer.appendChild(div);
                    });

                    updateImageUrl();
                })
                .catch(error => console.error('Error fetching connector data:', error));
        });
    }).then((value) => {
        for (let i = 0; i < dropdownElement.options.length; i++) {
            if (dropdownElement.options[i].innerHTML === "rj45") {
                dropdownElement.selectedIndex = i;
                dropdownElement.dispatchEvent(new Event('change'));
                return;
            }
        }
        dropdownElement.selectedIndex = 0;
        dropdownElement.dispatchEvent(new Event('change'));
    })
    .catch(error => console.error('Error fetching dropdown options:', error));