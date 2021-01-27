sap.ui.define([
	"isr/jmsl_GoodsReceipt/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(Controller, Filter, FilterOperator, JSONModel, Fragment, MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("isr.jmsl_GoodsReceipt.controller.GoodsReceipt", {

		/*
			Helper Methods
		*/

		_openDialog: function() {

			var oView = this.getView();
			var oItemsDialog = this.byId("ItemsDialog");

			if (!oItemsDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "isr.jmsl_GoodsReceipt.view.ItemsDialog",
					controller: this
				}).then(function(oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				oItemsDialog.open();
			}

		},

		_closeDialog: function() {
			this.byId("ItemsDialog").close();
		},

		_clearSelection: function() {

			var oView = this.getView();
			var inPoNo = this.byId("inPoNo");
			var inInvNo = this.byId("inInvNo");
			var inArticle = this.byId("inArticle");
			var dpSled = this.byId("dpSled");
			var inGrnQty = this.byId("inGrnQty");
			var btnOk = this.byId("btnOk");
			var btnNext = this.byId("btnNext");
			var btnPrev = this.byId("btnPrev");
			var txtItem = this.byId("txtItem");
			var piCompleted = this.byId("piCompleted");
			var btnViewItems = this.byId("btnViewItems");

			inPoNo.setEditable(true);
			inPoNo.setValue("");
			inPoNo.focus();
			inInvNo.setEditable(false);
			inInvNo.setValue("");
			inArticle.setEditable(false);
			inArticle.setValue("");
			dpSled.setEditable(false);
			inGrnQty.setEditable(false);
			btnOk.setEnabled(false);
			btnOk.setIcon("sap-icon://accept");
			btnOk.setType("Accept");
			btnNext.setEnabled(false);
			btnPrev.setEnabled(false);
			btnViewItems.setEnabled(false);
			txtItem.setText("0 of 0");
			piCompleted.setPercentValue(0);
			piCompleted.setDisplayValue("0 of 0");

			var poModel = new JSONModel(null);
			oView.setModel(poModel, "poModel");

			oView.bindElement({
				path: "/" + -1,
				model: "poModel"
			});
			return;

		},

		_setInputState: function(oInput, oState, oMessage) {
			oInput.setValueState(oState);
			oInput.setValueStateText(oMessage);
		},

		_readPoItems: function(sPonum) {

			var oView = this.getView();
			var oModel = oView.getModel("oModel");
			oView.setBusy(true);

			var oFilter = new Filter("Ponum", FilterOperator.EQ, sPonum);

			return new Promise(function(resolve, reject) {
				oModel.read("/poitemSet", {
					filters: [oFilter],
					success: function(oResult) {
						resolve(oResult);
						oView.setBusy(false);
					},
					error: function(oError) {
						reject(oError);
						oView.setBusy(false);
					}
				});
			});
		},

		_readArticle: function(sPonum, sArticle) {

			var oView = this.getView();
			var oModel = oView.getModel("oModel");
			oView.setBusy(true);

			return new Promise(function(resolve, reject) {
				oModel.read("/articleSet(Ponum='" + sPonum + "',Article='" + sArticle + "')", {
					success: function(oResult) {
						resolve(oResult);
						oView.setBusy(false);
					},
					error: function(oError) {
						reject(oError);
						oView.setBusy(false);
					}
				});
			});
		},

		_readGrItem: function(sPonum, sPoitem, iBaseqty, dGrnqty, sSled) {

			var oView = this.getView();
			var oModel = oView.getModel("oModel");
			oView.setBusy(true);

			return new Promise(function(resolve, reject) {
				oModel.read("/gritemSet(Ponum='" + sPonum + "',Poitem='" + sPoitem + "',Baseqty=" + iBaseqty + ",Grnqty=" + dGrnqty +
					",Sled='" + sSled + "')", {
						success: function(oResult) {
							resolve(oResult);
							oView.setBusy(false);
						},
						error: function(oError) {
							reject(oError);
							oView.setBusy(false);
						}
					});
			});
		},

		_setPoModel: function(oResult) {

			var oView = this.getView();
			var inPoNo = this.byId("inPoNo");
			var inInvNo = this.byId("inInvNo");
			var txtItem = this.byId("txtItem");
			var aPoItems = [];

			this._TotalCount = oResult.results.length;
			txtItem.setText("0 of " + this._TotalCount);
			this._updateProgress();

			for (var i = 0; i < oResult.results.length; i++) {

				var oItem = {
					Ponum: oResult.results[i].Ponum,
					Itemno: oResult.results[i].Itemno,
					Article: oResult.results[i].Article,
					Artdesc: oResult.results[i].Artdesc,
					Sled: "",
					Ordqty: oResult.results[i].Ordqty,
					Orduom: oResult.results[i].Orduom,
					Baseqty: oResult.results[i].Baseqty,
					Baseuom: oResult.results[i].Baseuom,
					Grnqty: "",
					GrnqtyError: "",
					SledError: "",
					Status: "I"
				};

				aPoItems.push(oItem);
			}

			var poModel = new JSONModel(aPoItems);

			oView.setModel(poModel, "poModel");

			inPoNo.setEditable(false);
			inInvNo.setEditable(true);
			inInvNo.focus();

		},

		_setInputEditable: function(bVisibility) {

			var dpSled = this.byId("dpSled");
			var inGrnQty = this.byId("inGrnQty");

			dpSled.setEditable(bVisibility);
			inGrnQty.setEditable(bVisibility);

		},

		_bindItem: function(sArticle) {

			var oView = this.getView();
			var poModel = oView.getModel("poModel");
			var aData = poModel.getData();
			var btnOk = this.byId("btnOk");
			var dpSled = this.byId("dpSled");
			var inGrnQty = this.byId("inGrnQty");
			var txtItem = this.byId("txtItem");

			btnOk.setEnabled(true);

			if (sArticle === "E") {
				oView.bindElement({
					path: "/" + -1,
					model: "poModel"
				});
				btnOk.setEnabled(false);
				return;
			}

			if (sArticle) {

				for (var i = 0; i < aData.length; i++) {

					if (aData[i].Article === sArticle && aData[i].Status !== "S") {
						this._CurrentIndex = i;
						break;
					}
				}

				if (i === aData.length) {
					for (var j = 0; j < aData.length; j++) {

						if (aData[j].Article === sArticle) {
							this._CurrentIndex = j;
							break;
						}
					}
				}

			} else {

				var inArticle = this.byId("inArticle");
				inArticle.setValue(aData[this._CurrentIndex].Article);

			}

			if (aData[this._CurrentIndex].Status === "S") {
				btnOk.setIcon("sap-icon://decline");
				btnOk.setType("Reject");
				this._setInputEditable(false);
			} else {

				if (aData[this._CurrentIndex].SledError) {
					this._setInputState(dpSled, "Error", aData[this._CurrentIndex].SledError);
				} else {
					this._setInputState(dpSled, "None", "");
				}

				if (aData[this._CurrentIndex].GrnqtyError) {
					this._setInputState(inGrnQty, "Error", aData[this._CurrentIndex].GrnqtyError);
				} else {
					this._setInputState(inGrnQty, "None", "");
				}

				btnOk.setIcon("sap-icon://accept");
				btnOk.setType("Accept");
				this._setInputEditable(true);
			}

			txtItem.setText(this._CurrentIndex + 1 + " of " + this._TotalCount);

			oView.bindElement({
				path: "/" + this._CurrentIndex,
				model: "poModel"
			});
		},

		_updateProgress: function() {

			var oView = this.getView();
			var oModel = oView.getModel("poModel");
			var aData = oModel.getData();

			var iCompleted = 0;
			for (var i = 0; i < aData.length; i++) {
				if (aData[i].Status === "S") {
					iCompleted++;
				}
			}

			var piCompleted = this.byId("piCompleted");
			var sProgress = iCompleted + " of " + this._TotalCount;
			var iPercent = iCompleted / this._TotalCount * 100;

			piCompleted.setPercentValue(iPercent);
			piCompleted.setDisplayValue(sProgress);

		},

		_setItemStatus: function() {

			var oView = this.getView();
			var oModel = oView.getModel("poModel");
			var aData = oModel.getData();
			var inArticle = this.byId("inArticle");
			var btnOk = this.byId("btnOk");

			if (aData[this._CurrentIndex].Status === "S") {
				aData[this._CurrentIndex].Status = "I";
				btnOk.setIcon("sap-icon://accept");
				btnOk.setType("Accept");
				this._setInputEditable(true);
			} else {
				this._bindItem("E");
				aData[this._CurrentIndex].Status = "S";
				this._setInputEditable(false);
				inArticle.setValue("");
				inArticle.focus();
			}

			oModel.refresh();

			this._updateProgress();

		},

		_validateItem: function() {

			var oView = this.getView();
			var poModel = oView.getModel("poModel");
			var aData = poModel.getData();
			var dpSled = this.byId("dpSled");
			var inGrnQty = this.byId("inGrnQty");

			var oItem = aData[this._CurrentIndex];
			var sPonum = oItem.Ponum;
			var sPoitem = oItem.Itemno;
			var iBaseqty = parseInt(oItem.Baseqty, 10);
			var dGrnqty = parseFloat(oItem.Grnqty);
			var sSled = oItem.Sled;

			if (oItem.SledError) {
				return false;
			}

			if (!dGrnqty) {
				oItem.Status = "E";
				oItem.GrnqtyError = this._geti18nText("msgEBlankGrnQty");
				this._setInputState(inGrnQty, "Error", this._geti18nText("msgEBlankGrnQty"));
				return false;
			}

			if (dGrnqty < 0) {
				oItem.Status = "E";
				oItem.GrnqtyError = this._geti18nText("msgENegativeGrnQty");
				this._setInputState(inGrnQty, "Error", this._geti18nText("msgENegativeGrnQty"));
				return false;
			}

			if (oItem.Status === "S") {
				this._setItemStatus();
				return true;
			}

			dGrnqty += "m";

			var oGrItem = this._readGrItem(sPonum, sPoitem, iBaseqty, dGrnqty, sSled);

			oItem.Status = "I";
			oItem.SledError = "";
			oItem.GrnqtyError = "";
			this._setInputState(dpSled, "None", "");
			this._setInputState(inGrnQty, "None", "");

			var that = this;
			oGrItem.then(function(oResult) {
				that._setItemStatus();
				return true;
			});

			oGrItem.catch(function(oError) {

				var oResponseText = JSON.parse(oError.responseText);
				var sMessage = oResponseText.error.message.value;
				var aSplit = sMessage.split("-");

				oItem.Status = "E";

				if (aSplit[0] === "dpSled") {
					oItem.SledError = aSplit[1];
					that._setInputState(dpSled, "Error", aSplit[1]);
				} else if (aSplit[0] === "inGrnQty") {
					oItem.GrnqtyError = aSplit[1];
					that._setInputState(inGrnQty, "Error", aSplit[1]);
				}

				return false;

			});

			return true;

		},

		_hasErrors: function(aData) {

			var iScount = 0;
			for (var i = 0; i < aData.length; i++) {

				if (aData[i].Status === "E") {
					MessageBox.error(this._geti18nText("msgEFixErrors"));
					return true;
				}

				if (aData[i].Status === "S") {
					iScount++;
				}

			}

			if (iScount === 0) {
				MessageBox.error(this._geti18nText("msgENoItems"));
				return true;
			}

			return false;
		},

		_postMatDoc: function(sInvnum, oModel, aData) {

			var oView = this.getView();

			oView.setBusy(true);

			var aMatDocLines = [];

			for (var i = 0; i < aData.length; i++) {

				if (aData[i].Status !== "S") {
					continue;
				}

				var oLine = {
					Ponum: aData[i].Ponum,
					Poitem: aData[i].Itemno,
					Grnqty: aData[i].Grnqty,
					Sled: aData[i].Sled
				};

				aMatDocLines.push(oLine);
			}

			var oMatdoc = {
				Ponum: aMatDocLines[0].Ponum,
				Invnum: sInvnum,
				Matdoc: "",
				Matyear: "",
				toMatDocLines: aMatDocLines
			};

			var that = this;
			oModel.create("/matdocheadSet", oMatdoc, {
				success: function(oResult) {
					oView.setBusy(false);
					that._clearSelection();

					var sSMessage = that._geti18nText("msgSMatDocPosted") + " : " + oResult.Matdoc + "/" + oResult.Matyear;
					MessageBox.success(sSMessage);
				},
				error: function(oError) {
					oView.setBusy(false);

					var oMsg,
						sEMessage;

					try {

						oMsg = JSON.parse(oError.responseText);
						sEMessage = oMsg.error.message.value;

					} catch (err) {

						var oParser = new DOMParser();
						var oXmlDoc = oParser.parseFromString(oError.responseText, "text/xml");
						sEMessage = oXmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

					}

					MessageBox.error(sEMessage);

				}
			});
		},

		/*
			Events
		*/

		onInit: function() {

			this._clearSelection();

		},

		onPoNoEnter: function(oEvent) {

			var inPoNo = this.byId("inPoNo");
			var sPonum = inPoNo.getValue();

			this._clearSelection();

			inPoNo.setValue(sPonum);

			if (!sPonum) {
				this._setInputState(inPoNo, "Error", this._geti18nText("msgEBlankPonum"));
				return;
			}

			if (sPonum.length !== 10) {
				this._setInputState(inPoNo, "Error", this._geti18nText("msgEInvalidPonum"));
				return;
			}

			var oPoItems = this._readPoItems(sPonum);

			var that = this;
			oPoItems.then(function(oResult) {
				that._setPoModel(oResult);
				that._setInputState(inPoNo, "None", "");
			});

			oPoItems.catch(function(oError) {
				var oResponseText = JSON.parse(oError.responseText);
				var sMessage = oResponseText.error.message.value;
				that._setInputState(inPoNo, "Error", sMessage);
			});

		},

		onInvNoEnter: function(oEvent) {

			var inInvNo = this.byId("inInvNo");
			var sInvno = inInvNo.getValue();

			if (!sInvno) {
				this._setInputState(inInvNo, "Error", this._geti18nText("msgEBlankInvno"));
				return;
			}

			this._setInputState(inInvNo, "None", "");

			var inArticle = this.byId("inArticle");
			var btnNext = this.byId("btnNext");
			var btnPrev = this.byId("btnPrev");
			var btnViewItems = this.byId("btnViewItems");

			inInvNo.setEditable(false);
			inArticle.setEditable(true);
			btnNext.setEnabled(true);
			btnPrev.setEnabled(true);
			btnViewItems.setEnabled(true);

			inArticle.focus();

		},

		onArticleEnter: function(oEvent) {

			var inPoNo = this.byId("inPoNo");
			var inArticle = this.byId("inArticle");
			var dpSled = this.byId("dpSled");
			var sPonum = inPoNo.getValue();
			var sArticle = inArticle.getValue();

			if (!sArticle) {
				this._setInputState(inArticle, "Error", this._geti18nText("msgEBlankArticle"));
				return;
			}

			var oArticle = this._readArticle(sPonum, sArticle);

			var that = this;
			oArticle.then(function(oResult) {
				inArticle.setValue(oResult.Article);
				that._setInputState(inArticle, "None", "");
				that._bindItem(oResult.Article);
				dpSled.focus();
			});

			oArticle.catch(function(oError) {
				var oResponseText = JSON.parse(oError.responseText);
				var sMessage = oResponseText.error.message.value;
				that._setInputState(inArticle, "Error", sMessage);
				that._bindItem("E");
			});

		},

		onSledChanged: function(oEvent) {

			var oView = this.getView();
			var poModel = oView.getModel("poModel");
			var aData = poModel.getData();

			var bValid = oEvent.getParameter("valid");
			var oItem = aData[this._CurrentIndex];
			
			var inGrnQty = this.byId("inGrnQty");

			if (!bValid) {
				oItem.Status = "E";
				oItem.SledError = this._geti18nText("msgEInvalidDate");
				this._setInputState(oEvent.getSource(), "Error", this._geti18nText("msgEInvalidDate"));
			} else {
				oItem.Status = "I";
				oItem.SledError = "";
				this._setInputState(oEvent.getSource(), "None", "");
				inGrnQty.focus();
			}

		},

		onPrev: function(oEvent) {

			var inArticle = this.byId("inArticle");
			this._setInputState(inArticle, "None", "");

			if (isNaN(this._CurrentIndex)) {
				this._CurrentIndex = 0;
			} else {

				if (this._CurrentIndex - 1 === -1) {
					this._CurrentIndex = this._TotalCount - 1;
				} else {
					this._CurrentIndex = this._CurrentIndex - 1;
				}
			}

			this._bindItem();

		},

		onNext: function(oEvent) {

			var inArticle = this.byId("inArticle");
			this._setInputState(inArticle, "None", "");
			if (isNaN(this._CurrentIndex)) {
				this._CurrentIndex = 0;
			} else {

				if (this._CurrentIndex + 1 === this._TotalCount) {
					this._CurrentIndex = 0;
				} else {
					this._CurrentIndex = this._CurrentIndex + 1;
				}
			}

			this._bindItem();

		},

		onOk: function(oEvent) {

			if (!this._validateItem()) {
				return;
			}

		},

		onViewItems: function(oEvent) {
			this._openDialog();
		},

		onCloseDialog: function() {
			this._closeDialog();
		},

		onItemPress: function(oEvent) {

			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext("poModel");
			var sPath = oContext.getPath();
			var iIndex = parseInt(sPath.replace("/", ""), 10);
			this._CurrentIndex = iIndex;

			this._bindItem();

			this._closeDialog();

		},

		onClear: function(oEvent) {

			var that = this;

			function onConfirm(sCode) {
				if (sCode !== 'OK') {
					return;
				}

				that._clearSelection();
			}

			var sHeader = this._geti18nText("lblClearSelection");
			var sQMessage = this._geti18nText("qtnDeleteItems");
			MessageBox.confirm(sQMessage, onConfirm, sHeader);

		},

		onSave: function(oEvent) {

			var oView = this.getView();
			var oModel = oView.getModel("oModel");
			var poModel = oView.getModel("poModel");
			var aData = poModel.getData();
			var sInvnum = this.byId("inInvNo").getValue();

			if (!this._hasErrors(aData)) {
				this._postMatDoc(sInvnum, oModel, aData);
			}
		}

	});

});