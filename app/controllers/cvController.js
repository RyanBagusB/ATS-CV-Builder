import { cvService } from '../services/cvService.js';
import { jsPDF } from 'jspdf';

const marginY = 1;

export const cvController = {
  init() {
    this.loadCV();
    document.getElementById('cvHeader').addEventListener('submit', this.saveCV.bind(this));
    document.getElementById('photo').addEventListener('change', this.previewPhoto.bind(this));
    document.getElementById('downloadPdf').addEventListener('click', this.downloadPDF.bind(this));
    document.getElementById('addSectionBtn').addEventListener('click', this.addSection.bind(this));
    document.getElementById('addFooterBtn').addEventListener('click', this.addFooter.bind(this));
  },

  saveCV(event) {
    event.preventDefault();
  
    const name = document.getElementById('name').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const linkedinURL = document.getElementById('linkedinURL').value;
    const portfolioURL = document.getElementById('portfolioURL').value;
    const address = document.getElementById('address').value;
    const description = document.getElementById('description').value;
    const photo = document.getElementById('photoPreview').src;
  
    const sections = document.querySelectorAll('.section');
    const cvBody = [];
  
    sections.forEach((section) => {
      const title = section.querySelector('.title').value;
      const experiences = section.querySelectorAll('.experience');
      const bodyExperience = [];
  
      experiences.forEach((experience) => {
        const name = experience.querySelector('.experienceName').value;
        const position = experience.querySelector('.experiencePosition').value;
        const location = experience.querySelector('.experienceLocation').value;
        const date = experience.querySelector('.experienceDate').value;
        const descriptions = experience.querySelectorAll('.experience-description-container li');
        const link = experience.querySelector('.experienceLink').value;

        const experienceDescription = [];

        descriptions.forEach((link) => {
          experienceDescription.push(link.querySelector('p').textContent);
        })
  
        bodyExperience.push({ name, position, location, date, descriptions: experienceDescription, link });
      });
  
      cvBody.push({ title, experiences: bodyExperience });
    });

    const footers = document.querySelectorAll('.footer');
    const cvFooter = [];

    footers.forEach((footer) => {
      const title = footer.querySelector('.title').value;
      const experiences = footer.querySelectorAll('.experience');
      const footerExperience = [];

      experiences.forEach((experience) => {
        const name = experience.querySelector('.experienceName').value;
        const elaboration = experience.querySelector('.experienceElaboration').value;
        const date = experience.querySelector('.experienceDate').value;
        const link = experience.querySelector('.experienceLink').value;

        footerExperience.push({ name, elaboration, date, link });
      });

      cvFooter.push({ title, experiences: footerExperience });
    });

    const cvData = { name, phoneNumber, email, linkedinURL, portfolioURL, address, description, photo, cvBody, cvFooter };
    cvService.saveCV(cvData);
    this.updatePreview(cvData);
  },

  loadCV() {
    const savedCV = cvService.getCV();
    if (savedCV) {
      document.getElementById('name').value = savedCV.name;
      document.getElementById('phoneNumber').value = savedCV.phoneNumber;
      document.getElementById('email').value = savedCV.email;
      document.getElementById('linkedinURL').value = savedCV.linkedinURL;
      document.getElementById('portfolioURL').value = savedCV.portfolioURL;
      document.getElementById('address').value = savedCV.address;
      document.getElementById('description').value = savedCV.description;

        savedCV.cvBody.forEach((section) => {
          this.addSection(section);
        });

        savedCV.cvFooter.forEach((footer) => {
          this.addFooter(footer);
        });

      if (savedCV.photo) {
        document.getElementById('photoPreview').src = savedCV.photo;
        document.getElementById('photoPreview').style.display = 'block';
      }
      this.updatePreview(savedCV);
    }
  },  

  previewPhoto(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('photoPreview').src = e.target.result;
      document.getElementById('photoPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  },

  updatePreview(cvData) {
    document.getElementById('namePreview').textContent = `Name: ${cvData.name}`;
    document.getElementById('emailPreview').textContent = `Email: ${cvData.email}`;
  },

  createHeaderPDF(doc, cvData, cursor) {
    const spacing = 0.2;
    const pageWidth = 21;
    const { name, phoneNumber, email, linkedinURL, portfolioURL, address, description, photo } = cvData;
    const imageSize = 3.5;
    const spacingY = 0.4;
    const gapY = 0.6;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(name.toUpperCase(), cursor.x + imageSize + 0.5, cursor.y + 0.47);
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const textParts = [phoneNumber, email, linkedinURL, portfolioURL];
    
    let currentX = cursor.x + imageSize + 0.5;
    let currentY = cursor.y + gapY + 0.5;

    textParts.forEach((part, index) => {
      doc.setTextColor(130, 130, 130);

      if (currentX + doc.getTextWidth(part.trim()) > pageWidth - (cursor.x * 2)) {
        currentY += spacingY;
        currentX = cursor.x + imageSize + 0.5;
      }

      doc.text(part.trim(), currentX, currentY);
      currentX += doc.getTextWidth(part.trim()) + spacing;
      if (index < textParts.length - 1 && part !== '') {
        doc.setTextColor(0, 0, 0);
        doc.text('|', currentX, currentY);
        currentX += spacing;
      }
    });

    currentY += gapY;
    currentX = cursor.x + imageSize + 0.5;

    if (address) {
      doc.setTextColor(130, 130, 130);
      doc.text(address, currentX, currentY);
      currentY += gapY;
      currentX = cursor.x + imageSize + 0.5;
    }

    doc.setTextColor(0, 0, 0);

    if (description) {
      const splittedDescription = description.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0);

      splittedDescription.forEach((part) => {
        if (currentX + doc.getTextWidth(part.trim()) > pageWidth - (cursor.x * 2)) {
          currentY += spacingY;
          currentX = cursor.x + imageSize + 0.5;
        }

        doc.text(part.trim(), currentX, currentY);
        currentX += doc.getTextWidth(part.trim()) + spacing - 0.1;
      });
    }
  
    if (photo) {
      doc.addImage(photo, 'JPEG', cursor.x, cursor.y, imageSize, imageSize);
    }

    if (currentY > imageSize) {
      cursor.y = currentY + 1;
    } else {
      cursor.y = imageSize + 1;
    }
  },

  addSection(cvSection) {
    const { title } = cvSection;
    const sectionHtml = `
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">${title ? title : 'Seksi Baru'}</h3>
          <button type="button" class="editTitleBtn">Edit</button>
        </div>
        <input value="${title ? title : ''}" class="title" type="text" name="title" style="display:none;">
        <button type="button" class="saveTitleBtn">Simpan</button>

        <div class="experience-container"></div>
         
        <button type="button" class="addExperienceBtn">Tambahkan Pengalaman</button>
        <button type="button" class="saveSectionBtn">Simpan Seksi</button>
        <button type="button" class="removeSectionBtn">Hapus Seksi</button>
      </div>
    `;
    
    const sectionElement = document.createElement('div');
    sectionElement.innerHTML = sectionHtml;
    document.getElementById('additionalSections').appendChild(sectionElement);
  
    const titleElement = sectionElement.querySelector('.section-title');
    titleElement.style.display = 'inline';
    const titleInput = sectionElement.querySelector('.title');
    const editButton = sectionElement.querySelector('.editTitleBtn');
    const saveButton = sectionElement.querySelector('.saveTitleBtn');
    const addExperienceBtn = sectionElement.querySelector('.addExperienceBtn');

    if (cvSection.experiences) {
      cvSection.experiences.forEach((experience) => {
        const experienceContainer = sectionElement.querySelector('.experience-container');
        this.addExperience(experience, experienceContainer);
      });
    }

    addExperienceBtn.addEventListener(('click'), () => {
      const experienceContainer = sectionElement.querySelector('.experience-container');
      this.addExperience(cvSection.experiences, experienceContainer);
    });

    saveButton.style.display = 'none';
  
    editButton.addEventListener('click', () => {
      titleInput.style.display = 'inline';
      titleInput.value = titleElement.textContent;
      titleElement.style.display = 'none';
      editButton.style.display = 'none';
      saveButton.style.display = 'inline';
    });

    saveButton.addEventListener('click', (event) => {
      titleInput.style.display = 'none';
      titleElement.textContent = titleInput.value;
      titleElement.style.display = 'inline';
      editButton.style.display = 'inline';
      saveButton.style.display = 'none';
      this.saveCV(event);
    });
  
    sectionElement.querySelector('.saveSectionBtn').addEventListener('click', this.saveCV.bind(this));
    
    sectionElement.querySelector('.removeSectionBtn').addEventListener('click', (event) => {
      sectionElement.remove();
      this.saveCV(event);
    });
  },

  addExperience(experience, container) {
    if (!experience) {
      experience = {};
    }
    const { name, position, location, date, link } = experience;
    const experienceElement = `
      <div class="experience">
        <h4 class="experience-title">${name ? name : '-'}</h4>
        <button class="deleteExperienceBtn">Hapus</button>
  
        <label>Nama Pengalaman</label>
        <input value="${name ? name : ''}" type="text" class="experienceName" name="experienceName">
        
        <label>Posisi</label>
        <input value="${position ? position : ''}" type="text" class="experiencePosition" name="experiencePosition">
        
        <label>Lokasi</label>
        <input value="${location ? location : ''}" type="text" class="experienceLocation" name="experienceLocation">
  
        <label>Bulan dan Tahun</label>
        <input value="${date ? date : ''}" type="text" class="experienceDate" name="experienceDate">
  
        <label>Deskripsi</label>
        <input type="text" class="experienceDescription" name="experienceDescription">
        <button type="button" class="saveDescriptionBtn">Simpan</button>
  
        <ul class="experience-description-container"></ul>

        <label>link Dokumen</label>
        <input value="${link ? link : ''}" type="text" class="experienceLink" name="experienceLink">
      </div>
    `;

    const experienceHtml = document.createElement('div');
    experienceHtml.innerHTML = experienceElement;
    container.appendChild(experienceHtml);

    const deleteExperienceBtn = experienceHtml.querySelector('.deleteExperienceBtn');

    deleteExperienceBtn.addEventListener('click', (event) => {
      experienceHtml.remove();
      this.saveCV(event);
    });
    
    const descriptionContainer = experienceHtml.querySelector('.experience-description-container');
    
    if (experience.descriptions) {
      experience.descriptions.forEach((description) => {
        const li = document.createElement('li');
        const p = document.createElement('p');
        p.textContent = description;
        li.appendChild(p);
    
        const deleteExperienceDescriptionBtn = document.createElement('button');
        deleteExperienceDescriptionBtn.textContent = 'Hapus';
        deleteExperienceDescriptionBtn.addEventListener('click', (event) => {
          li.remove();
          this.saveCV(event);
        });
    
        li.appendChild(deleteExperienceDescriptionBtn);
        descriptionContainer.appendChild(li);
      });
    }
    
    experienceHtml.querySelector('.saveDescriptionBtn').addEventListener('click', (event) => {
      const description = experienceHtml.querySelector('.experienceDescription').value;
      if (description.trim() !== '') {
        const li = document.createElement('li');
        const p = document.createElement('p');
        p.textContent = description;
        li.appendChild(p);
    
        const deleteExperienceDescriptionBtn = document.createElement('button');
        deleteExperienceDescriptionBtn.textContent = 'Hapus';
        deleteExperienceDescriptionBtn.addEventListener('click', (event) => {
          li.remove();
          this.saveCV(event);
        });
    
        li.appendChild(deleteExperienceDescriptionBtn);
        descriptionContainer.appendChild(li);
    
        experienceHtml.querySelector('.experienceDescription').value = '';
        this.saveCV(event);
      }
    });    
  },

  addFooterExperience(experience, experienceContainer) {
    if (!experience) {
      experience = {};
    }
    const { name, elaboration, date, link } = experience;
    const experienceHtml = `
      <div class="experience">
        <h4 class="experience-title">${name ? name : '-'}</h4>
  
        <label>Nama Pengalaman</label>
        <input value="${name ? name : ''}" type="text" class="experienceName" name="experienceName">
        
        <label>Penjelasan</label>
        <input value="${elaboration ? elaboration : ''}" type="text" class="experienceElaboration" name="experienceElaboration">
  
        <label>Bulan dan Tahun</label>
        <input value="${date ? date : ''}" type="text" class="experienceDate" name="experienceDate">

        <label>link Dokumen</label>
        <input value="${link ? link : ''}" type="text" class="experienceLink" name="experienceLink">
      </div>
    `;

    const experienceElement = document.createElement('div');
    experienceElement.innerHTML = experienceHtml;
    experienceContainer.appendChild(experienceElement);
  },

  addFooter(cvFooter) {
    const { title } = cvFooter;
    const footerHtml = `
      <div class="footer">
        <div class="footer-header">
          <h3 class="footer-title">${title ? title : 'Seksi Baru'}</h3>
          <button type="button" class="editTitleBtn">Edit</button>
        </div>
        <input value="${title ? title : ''}" class="title" type="text" name="title" style="display:none;">
        <button type="button" class="saveTitleBtn">Simpan</button>

        <div class="experience-container"></div>
         
        <button type="button" class="addExperienceBtn">Tambahkan Pengalaman</button>
        <button type="button" class="saveFooterBtn">Simpan Seksi</button>
        <button type="button" class="removeFooterBtn">Hapus Seksi</button>
      </div>
    `;
    
    const footerElement = document.createElement('div');
    footerElement.innerHTML = footerHtml;
    document.getElementById('additionalFooters').appendChild(footerElement);
  
    const titleElement = footerElement.querySelector('.footer-title');
    titleElement.style.display = 'inline';
    const titleInput = footerElement.querySelector('.title');
    const editButton = footerElement.querySelector('.editTitleBtn');
    const saveButton = footerElement.querySelector('.saveTitleBtn');
    const addExperienceBtn = footerElement.querySelector('.addExperienceBtn');

    if (cvFooter.experiences) {
      cvFooter.experiences.forEach((experience) => {
        const experienceContainer = footerElement.querySelector('.experience-container');
        this.addFooterExperience(experience, experienceContainer);
      });
    }

    addExperienceBtn.addEventListener(('click'), () => {
      const experienceContainer = footerElement.querySelector('.experience-container');
      this.addFooterExperience(cvFooter.experiences, experienceContainer);
    });

    saveButton.style.display = 'none';
  
    editButton.addEventListener('click', () => {
      titleInput.style.display = 'inline';
      titleInput.value = titleElement.textContent;
      titleElement.style.display = 'none';
      editButton.style.display = 'none';
      saveButton.style.display = 'inline';
    });

    saveButton.addEventListener('click', (event) => {
      titleInput.style.display = 'none';
      titleElement.textContent = titleInput.value;
      titleElement.style.display = 'inline';
      editButton.style.display = 'inline';
      saveButton.style.display = 'none';
      this.saveCV(event);
    });
  
    footerElement.querySelector('.saveFooterBtn').addEventListener('click', this.saveCV.bind(this));
    
    footerElement.querySelector('.removeFooterBtn').addEventListener('click', (event) => {
      footerElement.remove();
      this.saveCV(event);
    });
  },

  createBodyPDF(doc, cvData, cursor) {
    const cvBody = cvData.cvBody;
    let currentY = cursor.y;
    const gapY = 0.6;
    const startX = cursor.x;
    const maxHeight = 29.7 - marginY;

    const checkNewPage = () => {
      if (currentY >= maxHeight) {
        doc.addPage();
        currentY = marginY;
      }
    };
  
    if (cvBody) {
      cvBody.forEach((section) => {
        checkNewPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, cursor.x, currentY);
  
        const pageWidth = 21;
        const lineWidth = pageWidth - (cursor.x * 2) + 0.2;
        const indentation = 0.2;
        const lineStartX = (pageWidth - lineWidth) / 2;
        const lineEndX = lineStartX + lineWidth;
        const lineY = currentY + 0.15;
        const spaceY = 0.54;
        const spaceX = 0.2;
  
        doc.setLineWidth(0.04);
        doc.line(lineStartX, lineY, lineEndX, lineY);
  
        currentY += gapY;
  
        if (section.experiences) {
          section.experiences.forEach((experience) => {
            doc.setFontSize(9);
            checkNewPage();
            let currentX = startX + indentation;
  
            doc.setFont('helvetica', 'bold');
            doc.text(experience.name, currentX, currentY);
            const nameWidth = doc.getTextWidth(experience.name);
            currentX += nameWidth + spaceX;
  
            if (experience.link) {
              const pngImageUrl = '/link.png';
  
              const imageY = currentY - 0.27;
              const imageWidth = 0.28;
              const imageHeight = 0.28;
  
              doc.addImage(pngImageUrl, 'PNG', currentX, imageY + 0.04, imageWidth, imageHeight);
              doc.link(currentX, imageY, imageWidth, imageHeight, { url: experience.link });
  
              currentX += imageWidth + spaceX;
            }
  
            if (experience.location) {
              doc.setTextColor(130, 130, 130);
              doc.text(`- ${experience.location}`, currentX, currentY);
              doc.setTextColor(0, 0, 0);
            }
  
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            if (experience.date) {
              const dateWidth = doc.getTextWidth(experience.date);
              const dateX = pageWidth - cursor.x - dateWidth;
              doc.text(experience.date, dateX, currentY);
            }
  
            currentY += spaceY;

            doc.setFontSize(9);
            if (experience.position) {
              checkNewPage();
              currentX = startX + indentation;
              doc.text(experience.position, currentX, currentY);
            }

            currentY += spaceY;
            
            if (experience.descriptions) {
              const bullet = '\u2022';
              doc.setFont('helvetica', 'normal');
              experience.descriptions.forEach((description) => {
                checkNewPage();
                doc.text(bullet, startX + indentation + 0.2, currentY);
                const lines = doc.splitTextToSize(description, pageWidth - 0.2 - indentation - (cursor.x * 2));
                lines.forEach((line) => {
                  doc.text(line, startX + indentation + spaceX + 0.25, currentY);
                  currentY += spaceY;
                });
              });
            }
          });

          currentY += gapY;
        }
        cursor.y = currentY;
      });
    }
  },

  createFooterPDF(doc, cvData, cursor) {
    const cvFooter = cvData.cvFooter;
    let currentY = cursor.y;
    const gapY = 0.6;
    const startX = cursor.x + 0.2;
    const maxHeight = 29.7 - marginY;

    const checkNewPage = () => {
      if (currentY >= maxHeight) {
        doc.addPage();
        currentY = marginY;
      }
    };
  
    if (cvFooter) {
      cvFooter.forEach((footer) => {
        checkNewPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(footer.title, cursor.x, currentY);
  
        const pageWidth = 21;
        const lineWidth = pageWidth - (cursor.x * 2) + 0.2;
        const indentation = 0.2;
        const lineStartX = (pageWidth - lineWidth) / 2;
        const lineEndX = lineStartX + lineWidth;
        const lineY = currentY + 0.15;
        const spaceY = 0.54;
        const spaceX = 0.2;
  
        doc.setLineWidth(0.04);
        doc.line(lineStartX, lineY, lineEndX, lineY);
  
        currentY += gapY;

        if (footer.experiences) {
          footer.experiences.forEach((experience) => {
            doc.setFontSize(9);
            checkNewPage();
            let currentX = startX + indentation;
  
            doc.setFont('helvetica', 'bold');
            const bullet = '\u2022';
            doc.text(bullet, currentX, currentY);
            currentX += spaceX;
            doc.text(experience.name, currentX, currentY);
            const nameWidth = doc.getTextWidth(experience.name);
            currentX += nameWidth + spaceX;

            if (experience.link) {
              const pngImageUrl = '/link.png';
  
              const imageY = currentY - 0.3;
              const imageWidth = 0.28;
              const imageHeight = 0.28;
  
              doc.addImage(pngImageUrl, 'PNG', currentX, imageY + 0.04, imageWidth, imageHeight);
              doc.link(currentX, imageY, imageWidth, imageHeight, { url: experience.link });
  
              currentX += imageWidth + 0.1;
            }

            if (experience.elaboration) {
              doc.setFont('helvetica', 'bold');
              doc.text(': ', currentX, currentY);
              doc.setFont('helvetica', 'normal');
              doc.text(experience.elaboration, currentX + spaceX, currentY);
            }

            if (experience.date) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              const dateWidth = doc.getTextWidth(experience.date);
              const dateX = pageWidth - cursor.x - dateWidth;
              doc.text(experience.date, dateX, currentY);
            }
  
            currentY += spaceY;
          });
          currentY += gapY;
        }
      });
    }
  },

  downloadPDF() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: "a4"
    });
    const cursor = { x: 0.7, y: marginY };
    const cvData = cvService.getCV();
  
    this.createHeaderPDF(doc, cvData, cursor);
    this.createBodyPDF(doc, cvData, cursor);
    this.createFooterPDF(doc, cvData, cursor);
    
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    document.getElementById('pdfPreview').src = pdfUrl;
    // doc.save('cv.pdf');
  },
};
