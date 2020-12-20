const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=07540548-0540-49e2-b630-3c9dcb4a0abd';

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    }
}

async function fetchAllCenturies() {
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    if (localStorage.getItem('centuries')) {  
        const centuriesObj =  localStorage.getItem('centuries')
        return JSON.parse(centuriesObj)
      }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      localStorage.setItem('centuries', JSON.stringify(records)) 
      return records;
    } catch (error) {
      console.error(error);
    }
}

async function fetchAllClassifications(){
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    if (localStorage.getItem('classifications')) { 
        const classificationsObj =  localStorage.getItem('classifications')
        return JSON.parse(classificationsObj)       
      }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      localStorage.setItem('classifications', JSON.stringify(records)) 
      return records;
    } catch (error) {
      console.error(error);
    }
}

async function prefetchCategoryLists() {
    onFetchStart();
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);
        $('.classification-count').text(`(${ classifications.length })`);

        classifications.forEach(classification => {
            $('#select-classification').append(`<option value="${classification.name}">${classification.name}</option>`)
        });
        $('.century-count').text(`(${ centuries.length }))`);

        centuries.forEach(century => {
            $('#select-century').append(`<option value="${century.name}">${century.name}</option>`)
        });
    } catch (error) {
      console.error(error);
    } finally {
        onFetchEnd();
      }
}

function buildSearchString(){
    const classVal = $('#select-classification').val();
    const centuryVaL = $('#select-century').val();
    const keywordVal = $('#keywords').val();
    const searchString = encodeURI(`${ BASE_URL }/object?${ KEY }&classification=${classVal}&century=${centuryVaL}&keyword=${keywordVal}`)
    return searchString
}

$('#search').on('submit', async function (event) {
    event.preventDefault();
    onFetchStart();
  
    try {
        const url = buildSearchString();
        const response = await fetch(url)
        const data = await response.json();
        const infoData = data.info
        const recordsData = data.records
        updatePreview(data);
    } catch (error) {
        console.error(error);
    } finally {
        onFetchEnd();
      }
});

function onFetchStart() {
    $('#loading').addClass('active');
}
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
}

function renderPreview(record) {
    const {primaryimageurl, title, description} = record    
    return $(`<div class="object-preview">
                <a href="#">
                ${primaryimageurl ? `<img src="${primaryimageurl}"/>` : ''}
                ${title ? `<h3>${title}</h3>` : ''}
                ${description ? `<h4>${description}</h4>` : ''}
                </a>
            </div>`).data('record', record)
  
}
  
  
function updatePreview(data) {
    const {info, records} = data
    const root = $('#preview');
    $('.results').empty();
    if (info.next){
        $('.next').attr('disabled', false).data('key', info.next)
    }else {
        $('.next').attr('disabled', true).data('key', null)
    }
    if (info.prev){
        $('.previous').attr('disabled', false).data('key', info.prev)
    }else {
        $('.previous').attr('disabled', true).data('key', null)
    }
    records.forEach(record => {
        $('.results').append(
            renderPreview(record)
        )
    })
}

$('#preview .next, #preview .previous').on('click', async function () {
    onFetchStart();
    const url = $(this).data('key')
    try {
        const response = await fetch(url);
        const data = await response.json();
        updatePreview(data);
    }catch (error){
        console.error(error)
    }finally {
        onFetchEnd();
    }
});

$('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault(); 
    const records = $(this).closest('.object-preview').data('record')
    $('#feature').html(renderFeature(records))
});

function renderFeature(record) {
     const {title, dated, description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline, images, primaryimageurl} = record
    
    return $(`<div class="object-feature">
                    <header>
                    <h3>${title}</h3>
                    <h4>${dated}</h4>
                    </header>
                    <section class="facts">
                        ${ factHTML("Description", description ) }
                        ${ factHTML("Culture", culture, 'culture') }
                        ${ factHTML("Style", style) }
                        ${ factHTML("Technique", technique, 'technique') }
                        ${ factHTML("Medium", medium, 'medium') }
                        ${ factHTML("Dimensions", dimensions) }
                        ${
                            record.people
                            ? record.people.map(function(person) {
                                return factHTML('Person', person.displayname, 'person');
                              }).join('')
                            : ''
                          }
                        ${ factHTML("Department", department) }
                        ${ factHTML("Division", division) }
                        ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
                        ${ factHTML("Creditline", creditline) }
                    </section>
                    <section class="photos">
                        ${ photosHTML(images, primaryimageurl) }
                    </section>
                </div>`);
}

function searchURL(searchType, searchString) {
    return encodeURI(`${ BASE_URL }/object?${ KEY }&${ searchType }=${ searchString }`);
  }
  
  function factHTML(title, content, searchTerm = null) {
      if(!content){
          return ''
      }else if (!searchTerm){
          return `<span class="title">${title}</span>
                  <span class="content">${content}</span>`
      }else {
          return `<span class="title">${title}</span>
                   <span class="content"><a href="${searchURL(searchTerm, content)}">${content}</a></span>`
      }
}

function photosHTML(images, primaryimageurl) {
    let imgEl = ''
    if(images && images.length>0){
        images.forEach(function(image){
            imgEl+= `<img src="${image.baseimageurl}" />`
        })
        return imgEl
    } else if (primaryimageurl) {
        return `<img src="${primaryimageurl}" />`
    }else {
        return ''
    }
} 



$('#feature').on('click', 'a', async function (event) {
    const href = $(this).attr('href')
    onFetchStart();
    if (href.startsWith('mailto')) { return onFetchEnd(); }
    event.preventDefault();
     
    try {
        
          
            const response = await fetch(href);
            const data = await response.json();
            updatePreview(data);
        }catch (error){
            console.error(error)
        }finally {
            onFetchEnd();
        }   
});


fetchAllCenturies()
fetchAllClassifications();
prefetchCategoryLists();
